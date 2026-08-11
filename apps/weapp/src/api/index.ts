import alovaInstance from './core/instance'
import { createApis, withConfigType } from './createApis'

export { alovaInstance }

export const $$userConfigMap = withConfigType({})

const Apis = createApis(alovaInstance, $$userConfigMap)

export default Apis
export { Apis }
