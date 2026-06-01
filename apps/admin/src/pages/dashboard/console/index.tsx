import { Card, Row, Col, Typography, Space } from "antd";
import {
  SmileOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { getUser } from "@/store/userStore";

dayjs.locale("zh-cn");

const { Title, Text } = Typography;

const getGreeting = () => {
  const hour = dayjs().hour();
  if (hour < 6) return "夜深了";
  if (hour < 9) return "早上好";
  if (hour < 12) return "上午好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  if (hour < 22) return "晚上好";
  return "夜深了";
};

const Console = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const user = getUser();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayName = user?.nickname || user?.username || "访客";

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-linear-to-br from-blue-500/10 via-indigo-500/5 to-transparent dark:from-blue-600/20 dark:via-indigo-600/10 p-8 border border-blue-200/50 dark:border-blue-800/30">
        <Space orientation="vertical" size="large" className="w-full">
          <Space align="center" className="flex-wrap">
            <SmileOutlined className="text-4xl text-blue-500" />
            <div>
              <Title level={2} className="mb-1! font-semibold!">
                {getGreeting()}，{displayName}！
              </Title>
              <Text type="secondary" className="text-base">
                欢迎回来，祝您今天工作顺利
              </Text>
            </div>
          </Space>

          <Row gutter={[24, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" className="shadow-sm">
                <Space>
                  <CalendarOutlined className="text-xl text-blue-500" />
                  <div>
                    <Text type="secondary" className="text-xs">
                      今日日期
                    </Text>
                    <div className="font-medium">
                      {currentTime.format("YYYY年MM月DD日 dddd")}
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" className="shadow-sm">
                <Space>
                  <ClockCircleOutlined className="text-xl text-green-500" />
                  <div>
                    <Text type="secondary" className="text-xs">
                      当前时间
                    </Text>
                    <div className="font-medium font-mono">
                      {currentTime.format("HH:mm:ss")}
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" className="shadow-sm">
                <Space>
                  <RocketOutlined className="text-xl text-orange-500" />
                  <div>
                    <Text type="secondary" className="text-xs">
                      今日宜
                    </Text>
                    <div className="font-medium">高效工作 · 专注创造</div>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Space>
      </div>
    </div>
  );
};

export default Console;
