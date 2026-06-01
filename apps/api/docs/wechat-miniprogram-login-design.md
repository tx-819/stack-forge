# 微信小程序登录接入设计文档

> 参考微信官方文档：[小程序登录](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html)
>
> 目标：严格按照官方「`wx.login` → `auth.code2Session` → 生成自定义登录态」流程，在现有 NestJS + Passport + JWT + Prisma + Redis 架构上接入小程序登录。

## 一、官方登录流程回顾

```
小程序端                         开发者服务器(本项目)                   微信接口服务
  │  wx.login() 获取 code            │                                      │
  │ ───────────────────────────────►│                                      │
  │      携带 code 调用后端登录接口   │  auth.code2Session(appid,secret,code) │
  │                                  │ ────────────────────────────────────►│
  │                                  │   返回 openid / session_key / unionid │
  │                                  │ ◄────────────────────────────────────│
  │                                  │  根据 openid 建立/查询用户体系         │
  │   返回自定义登录态(accessToken)   │  生成自定义登录态(JWT)                 │
  │ ◄───────────────────────────────│                                      │
  │  后续请求携带 accessToken         │                                      │
```

**官方强约束（实现时必须遵守）：**

1. `wx.login` 返回的 `code`**只能使用一次**，由小程序端获取后传给后端，后端换取后即作废。
2. `auth.code2Session` 接口：`GET https://api.weixin.qq.com/sns/jscode2session`，参数 `appid`、`secret`、`js_code`、`grant_type=authorization_code`。
3. 会话密钥 `session_key` 是加密签名密钥，**绝不能下发给小程序端，也不能对外提供**。后端如需保存只能存在服务端（本项目放 Redis）。
4. `unionid` 仅在小程序已绑定微信开放平台账号时返回，需做可空处理。
5. 自定义登录态（本项目复用现有 JWT accessToken + refreshToken 机制）用于后续接口识别用户身份，不要直接用 `openid` 作为登录态对外暴露。

## 二、与现有架构的对接点

| 现有能力                                                                  | 复用方式                                       |
| ------------------------------------------------------------------------- | ---------------------------------------------- |
| `TokenService.generateToken` / `createAccessToken` / `createRefreshToken` | 换取 openid 并定位用户后，直接生成自定义登录态 |
| `JwtStrategy` + `JwtAuthGuard`（全局 `APP_GUARD`）                        | 小程序登录后的后续请求鉴权完全复用，无需改动   |
| `@Public()` 装饰器                                                        | 登录接口标记为公开                             |
| `CacheService`（Redis）                                                   | 缓存接口调用凭证 `access_token`（如需手机号）  |
| `UserService`                                                             | 按 openid 查询 / 创建用户                      |
| `ConfigService` + `registerAs` 配置模式                                   | 新增 `wechat` 配置命名空间                     |
| `DocResponse` / Swagger 装饰器                                            | 接口文档化                                     |

**关键差异点（需要决策）：** 现有 `User` 模型的 `email`、`username`、`password` 均为必填且唯一，而微信用户初始只有 `openid`。需要在数据模型层做适配（见第三步方案）。

## 三、实现步骤

### 步骤 1：新增微信配置命名空间

新增 `src/common/configs/wechat.config.ts`，并在 `src/common/configs/index.ts` 中注册。

```ts
// src/common/configs/wechat.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('wechat', () => ({
    miniProgram: {
        appId: process.env.WECHAT_MINI_APP_ID || '',
        appSecret: process.env.WECHAT_MINI_APP_SECRET || '',
        // 微信接口服务根地址，抽成配置便于测试 mock
        apiBaseUrl:
            process.env.WECHAT_API_BASE_URL || 'https://api.weixin.qq.com',
    },
}));
```

环境变量补充到 `.env` / 部署配置：`WECHAT_MINI_APP_ID`、`WECHAT_MINI_APP_SECRET`。

> `appSecret` 属于敏感信息，只能放服务端环境变量，不可提交到仓库、不可下发前端。
>
> 说明：本方案不再长期保存 `session_key`。`code2Session` 返回的 `session_key` 仅用于本次换取流程，**不写入 Redis**（头像昵称走「填写能力」、手机号走「code 换取」，均不依赖解密）。

### 步骤 2：数据模型适配（Prisma）

为 `User` 模型增加微信身份字段。推荐方案：**直接在 `User` 上扩展字段**（改动最小，符合现有单用户表风格）。

```prisma
model User {
  id        Int        @id @default(autoincrement())
  email     String?    @unique          // 改为可空：微信用户初始无邮箱
  username  String     @unique
  password  String?                      // 改为可空：微信用户无密码
  nickname  String?
  avatar    String?
  openid    String?    @unique @map("wx_openid")   // 微信小程序 openid
  unionid   String?    @map("wx_unionid")          // 开放平台 unionid（可空）
  isSuper   Boolean    @default(false) @map("is_super")
  status    Boolean    @default(true)
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")
  roles     UserRole[]

  @@index([unionid])
  @@map("user")
}
```

配套改动（因为 `email`/`password` 由必填改为可空）：

- 现有 `AuthService.validateUser` 中 `compare(password, user.password)` 需处理 `password` 为 `null` 的微信账号（无密码账号禁止用账号密码登录）。
- `UserService.create` 中 `data.password ?? '123456'` 逻辑保留给后台创建用户；微信注册走独立创建方法（见步骤 4），可不落 `password`。
- 为微信用户生成占位 `username`（如 `wx_${openid}` 或随机串），满足 `username` 唯一非空约束。

执行迁移：

```bash
pnpm prisma migrate dev --name add_wechat_identity
pnpm prisma:generate
```

> 备选方案（如不想动 `User` 必填约束）：新建 `UserIdentity` 表（`userId` + `provider` + `openid` + `unionid`），一个用户可绑定多种登录方式。扩展性更好，但改动量更大。本文档默认采用扩展 `User` 的方案，可按需切换。

### 步骤 3：微信接口服务（调用 code2Session）

新增 `src/modules/auth/services/wechat.service.ts`，负责调用官方 `auth.code2Session` 并处理错误码。使用 Node 22 内置 `fetch`，无需新增 HTTP 依赖。

```ts
// 核心方法签名（实现要点）
interface Code2SessionResult {
    openid: string;
    sessionKey: string;  // 仅本次流程使用，不落库、不下发
    unionid?: string;
}

@Injectable()
export class WechatService {
    constructor(
        private readonly configService: ConfigService,
        private readonly cacheService: CacheService
    ) {}

    async code2Session(code: string): Promise<Code2SessionResult> {
        // 1. GET {apiBaseUrl}/sns/jscode2session
        //    拼接 appid / secret / js_code / grant_type=authorization_code
        // 2. fetch GET，解析 JSON
        // 3. 处理 errcode：
        //    - 0：成功，返回 { openid, session_key, unionid }
        //    - 40029：js_code 无效  -> UnauthorizedException
        //    - 45011：频率限制      -> 限流/友好提示
        //    - 40226：高风险用户被拦截
        //    - -1   ：系统繁忙，建议重试
        //    其余 errcode 统一抛 BadRequest/Unauthorized
    }
}
```

**实现注意：**

- `session_key` 不写入 Redis、不进入任何返回体；换取 openid 后即丢弃。
- 接口无网络/超时需有兜底异常，避免裸抛。
- `appId`/`appSecret` 为空时启动即应给出明确告警（便于排查配置缺失）。

### 步骤 4：用户体系打通（按 openid 查询 / 创建）

在 `UserService` 增加按 openid 查询与微信用户创建方法：

```ts
// UserService 新增
findByOpenid(openid: string): Promise<User | null>;          // where: { openid }
createWechatUser(params: {                                    // 首次登录自动注册
    openid: string;
    unionid?: string;
}): Promise<User>;   // username 用占位值，绑定默认角色 ROLE_CODE_USER
```

在 `AuthService` 增加编排方法 `wechatMiniLogin`：

```ts
async wechatMiniLogin(code: string): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    // 1. wechatService.code2Session(code) -> { openid, sessionKey, unionid }
    // 2. user = userService.findByOpenid(openid) ?? createWechatUser({ openid, unionid })
    //    （可顺带回填 unionid；sessionKey 用完即弃，不保存）
    // 3. tokenService.generateToken(user) -> { accessToken, refreshToken }
    // 4. 返回 { accessToken, refreshToken, user }
}
```

> 默认角色复用现有 `ROLE_CODE_USER` 常量，与 `register` 保持一致。

### 步骤 5：DTO 定义

在 `src/modules/auth/dtos/auth.dto.ts` 新增：

```ts
export class WechatMiniLoginDto {
    @ApiProperty({ description: 'wx.login 返回的临时登录凭证 code' })
    @IsString()
    @IsNotEmpty()
    code: string;
}

// 响应：在 AuthResponseDto 基础上扩展可选 refreshToken（小程序回退响应体时返回）
export class WechatAuthResponseDto extends AuthResponseDto {
    @ApiProperty({ description: '刷新令牌（小程序不支持 Cookie 时返回）', required: false })
    @IsString()
    @IsOptional()
    refreshToken?: string;
}

// 头像昵称填写能力：前端 chooseAvatar / input[type=nickname] 收集后按普通字段提交
export class UpdateWechatProfileDto {
    @ApiProperty({ description: '昵称', required: false })
    @IsString()
    @IsOptional()
    nickname?: string;

    @ApiProperty({ description: '头像（已上传后的 URL）', required: false })
    @IsString()
    @IsOptional()
    avatar?: string;
}

// 获取手机号：getPhoneNumber 按钮返回的动态令牌 code
export class WechatPhoneCodeDto {
    @ApiProperty({ description: 'getPhoneNumber 回调返回的 code（非 wx.login 的 code）' })
    @IsString()
    @IsNotEmpty()
    code: string;
}

// 绑定真实邮箱入参
export class BindEmailDto {
    @ApiProperty({ description: '要绑定的邮箱' })
    @IsEmail()
    @IsNotEmpty()
    email: string;
}
```

登录响应使用 `WechatAuthResponseDto`：`accessToken` + `user` 必返，`refreshToken` 仅在小程序回退响应体时返回。

### 步骤 6：登录接口（Controller）

在 `AuthController` 新增公开接口。**登录态下发采用「Cookie 优先、不支持则回退响应体」策略**（决策 3）：原生小程序的 `wx.request` 不会自动携带/管理 Cookie，因此通过约定请求头判断客户端类型。

```ts
@Post('wechat/mini-login')
@Public()
@ApiOperation({ summary: '微信小程序登录' })
@DocResponse({ serialization: WechatAuthResponseDto, isPublic: true })
async wechatMiniLogin(
    @Body() dto: WechatMiniLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
) {
    const { accessToken, refreshToken, user } =
        await this.authService.wechatMiniLogin(dto.code);

    // 客户端是否支持 Cookie：约定请求头 X-Client（'web' 走 Cookie，'miniprogram' 走响应体）
    const client = req.headers['x-client'];
    const supportsCookie = client !== 'miniprogram';

    if (supportsCookie) {
        // 复用现有 res.cookie('refreshToken', ...) 逻辑下发刷新令牌
        return { accessToken, user };
    }
    // 小程序：refreshToken 随响应体返回，由小程序本地 storage 保存
    return { accessToken, refreshToken, user };
}
```

> 约定：小程序端调用时显式带请求头 `X-Client: miniprogram`，后端据此把 `refreshToken` 放进响应体；其余客户端（Web）维持现有 httpOnly Cookie 行为。`WechatAuthResponseDto` 在 `AuthResponseDto` 基础上把 `refreshToken` 设为可选字段。

### 步骤 7：获取用户资料与手机号（不使用 session_key 解密）

> 背景：微信已弃用 session_key 解密获取头像昵称（2022-11-08 后 `getUserProfile` 仅返回匿名数据），手机号也改为 code 换取。因此本方案**不做开放数据解密**。

**7.1 头像与昵称 —— 头像昵称填写能力**

小程序端用 `<button open-type="chooseAvatar">` 选头像、`<input type="nickname">` 填昵称，前端拿到后头像按普通文件上传得到 URL，再把 `{ nickname, avatar }` 当普通字段提交。后端仅做一个常规更新接口：

```ts
@Post('wechat/profile')
@ApiOperation({ summary: '更新微信用户资料（头像昵称填写能力）' })
updateProfile(@ReqUser() user: User, @Body() dto: UpdateWechatProfileDto) {
    return this.authService.updateWechatProfile(user.id, dto); // 直接 UserService.update
}
```

**7.2 手机号 —— code 换取（新版手机号验证组件）**

小程序端 `<button open-type="getPhoneNumber" bindgetphonenumber>` 回调拿到 `code`（独立于登录 code），传给后端换取手机号。需要先获取接口调用凭证 `access_token`。在 `WechatService` 增加：

```ts
// access_token 缓存到 Redis（expires_in 约 7200s，按返回值设置 TTL，避免频繁刷新）
async getAccessToken(): Promise<string> {
    // 1. 命中 Redis 缓存（key 如 wx_access_token）直接返回
    // 2. GET {apiBaseUrl}/cgi-bin/token?grant_type=client_credential&appid=..&secret=..
    //    （生产建议改用 /cgi-bin/stable_token，避免并发刷新互相顶掉）
    // 3. 写缓存（TTL = expires_in - 留 300s 余量），返回 access_token
}

// 用 getPhoneNumber 的 code 换手机号
async getPhoneNumber(code: string): Promise<{ phoneNumber: string; purePhoneNumber: string; countryCode: string }> {
    // POST {apiBaseUrl}/wxa/business/getuserphonenumber?access_token=ACCESS_TOKEN
    // body: { code }
    // 处理 errcode；成功返回 phone_info
}
```

对应受保护接口：

```ts
@Post('wechat/phone')
@ApiOperation({ summary: '获取微信用户手机号' })
getPhone(@ReqUser() user: User, @Body() dto: WechatPhoneCodeDto) {
    return this.authService.bindWechatPhone(user.id, dto.code); // 换取后可回填到用户
}
```

> 若不需要手机号，可省略 7.2 及 `getAccessToken`/`getPhoneNumber`。头像昵称（7.1）是纯业务字段更新，可直接复用现有 `UserService.update`，本质上不算微信专属逻辑。

### 步骤 8：绑定真实邮箱

> 决策 4：微信用户初始为占位 `username`（`wx_${openid}`）、`email` 为空，允许后续绑定真实邮箱。

`UserService` 增加 `bindEmail(userId, email)`：校验邮箱未被占用 → 更新 `User.email`。`AuthService` 增加编排并暴露受保护接口：

```ts
@Post('wechat/bind-email')
@ApiOperation({ summary: '微信用户绑定邮箱' })
bindEmail(@ReqUser() user: User, @Body() dto: BindEmailDto) {
    return this.authService.bindWechatUserEmail(user.id, dto.email);
}
```

要点：邮箱唯一冲突需抛 `BadRequestException`；可结合现有邮件验证码 / `sendLoginEmail` 机制做二次验证（如需更强校验，作为后续增量）。

### 步骤 9：模块装配

在 `auth.module.ts` 的 `providers` 中注册 `WechatService`（`CacheModule` 已在 imports 中，无需重复引入）。后续 JWT 鉴权完全复用现有 `JwtStrategy` / 全局 `JwtAuthGuard`，无需新增 Passport 策略。

### 步骤 10：测试与验证

- **单元测试**：
  - `WechatService.code2Session` 对各 errcode 分支用 mock fetch 覆盖；
  - `WechatService.getAccessToken` 覆盖缓存命中/刷新；`getPhoneNumber` 覆盖成功与错误码（如需手机号）；
  - `AuthService.wechatMiniLogin` 覆盖「新用户自动注册」「老用户直接登录」两条路径。
- **联调验证**：小程序端 `wx.login` 拿 code → 调 `/auth/wechat/mini-login` → 校验返回 `accessToken` → 用该 token 调 `/auth/me` 成功 →（可选）`getPhoneNumber` 拿 code 调 `/auth/wechat/phone` 成功 → 调 `/auth/wechat/bind-email` 绑定邮箱成功。
- **安全核对**：确认任何返回体 / 日志中都不包含 `session_key`、`access_token` 与 `appSecret`；确认登录 `code` 不被复用。
- 遵循 `verification-before-completion`：以上命令与联调结果需有实际输出佐证后方可判定完成。

## 四、改动文件清单

| 文件                                              | 操作 | 说明                                            |
| ------------------------------------------------- | ---- | ----------------------------------------------- |
| `src/common/configs/wechat.config.ts`             | 新增 | 微信配置命名空间                                |
| `src/common/configs/index.ts`                     | 修改 | 注册 WechatConfig                               |
| `prisma/schema.prisma`                            | 修改 | User 增加 openid/unionid，email/password 改可空 |
| `src/modules/auth/services/wechat.service.ts`     | 新增 | code2Session、access_token 缓存、getPhoneNumber（如需） |
| `src/modules/auth/services/auth.service.ts`       | 修改 | 新增 `wechatMiniLogin` / `updateWechatProfile` / `bindWechatPhone`(可选) / `bindWechatUserEmail` 编排 |
| `src/modules/user/services/user.service.ts`       | 修改 | `findByOpenid` / `createWechatUser` / `bindEmail` |
| `src/modules/auth/dtos/auth.dto.ts`               | 修改 | 新增 `WechatMiniLoginDto` / `WechatAuthResponseDto` / `UpdateWechatProfileDto` / `WechatPhoneCodeDto`(可选) / `BindEmailDto` |
| `src/modules/auth/controllers/auth.controller.ts` | 修改 | 新增 `/auth/wechat/mini-login`、`/auth/wechat/profile`、`/auth/wechat/phone`(可选)、`/auth/wechat/bind-email` |
| `src/modules/auth/auth.module.ts`                 | 修改 | 注册 `WechatService`                            |
| `.env` / 部署配置                                 | 修改 | 新增 appId/appSecret 等环境变量                 |

## 五、已确认决策

1. **数据模型方案**：✅ 扩展 `User` 表（新增 `openid`/`unionid`，`email`/`password` 改可空）。
2. **是否解密用户信息**：✅ 不做 session_key 解密（已过时）。头像昵称走「填写能力」当普通字段更新；手机号走「code 换取」（`getuserphonenumber`）。`session_key` 用完即弃、不留存（步骤 7）。
3. **refreshToken 下发方式**：✅ Cookie 优先、不支持则回退响应体。通过约定请求头 `X-Client: miniprogram` 区分客户端（步骤 6）。
4. **占位 username / 邮箱绑定**：✅ 微信用户用占位 `username`（`wx_${openid}`），`email` 初始为空，允许后续绑定真实邮箱（步骤 8）。
