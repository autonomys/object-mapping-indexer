import { IPLDNodeData, PBNode } from '@autonomys/auto-dag-data'

export const safeIPLDDecode = (node: PBNode): IPLDNodeData | undefined => {
  return node.Data ? IPLDNodeData.decode(node.Data) : undefined
}
