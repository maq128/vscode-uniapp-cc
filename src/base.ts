import * as vscode from 'vscode'

export type Mask = number

export const Platforms: {
  [key: string]: Mask
} = {
  ALL:                      0b1_111_111111111_1111_1_11,

  ALL_VUE:                  0b0_000_000000000_0000_0_11,
  'VUE2':                   0b1_111_111111111_1111_1_01,
  'VUE3':                   0b1_111_111111111_1111_1_10,

  ALL_TARGET:               0b1_111_111111111_1111_1_00,
  'H5':                     0b0_000_000000000_0000_1_11,
  'WEB':                    0b0_000_000000000_0000_1_11,
  'APP':                    0b0_000_000000000_1111_0_11,
  'APP-PLUS':               0b0_000_000000000_0001_0_11,
  'APP-PLUS-NVUE':          0b0_000_000000000_0010_0_11,
  'APP-NVUE':               0b0_000_000000000_0010_0_11,
  'APP-ANDROID':            0b0_000_000000000_0100_0_11,
  'APP-IOS':                0b0_000_000000000_1000_0_11,
  'MP':                     0b0_000_111111111_0000_0_11,
  'MP-WEIXIN':              0b0_000_000000001_0000_0_11,
  'MP-ALIPAY':              0b0_000_000000010_0000_0_11,
  'MP-BAIDU':               0b0_000_000000100_0000_0_11,
  'MP-TOUTIAO':             0b0_000_000001000_0000_0_11,
  'MP-LARK':                0b0_000_000010000_0000_0_11,
  'MP-QQ':                  0b0_000_000100000_0000_0_11,
  'MP-KUAISHOU':            0b0_000_001000000_0000_0_11,
  'MP-JD':                  0b0_000_010000000_0000_0_11,
  'MP-360':                 0b0_000_100000000_0000_0_11,
  'QUICKAPP-WEBVIEW':       0b0_001_000000000_0000_0_11,
  'QUICKAPP-WEBVIEW-UNION': 0b0_010_000000000_0000_0_11,
  'QUICKAPP-WEBVIEW-HUAWEI':0b0_100_000000000_0000_0_11,
  'UNI-APP-X':              0b1_000_100000000_0000_0_11,
}

export type PlatformName = keyof typeof Platforms

// 使文字变灰的装饰器
export const dimeDecorationType = vscode.window.createTextEditorDecorationType({
  dark: {
    color: '#505050',
  },
  light: {
    color: '#d0d0d0',
  }
})

// 一个条件编译代码块的信息
export class BlockDesc {
  head: vscode.Range
  foot: vscode.Range
  outside: Mask
  inside: Mask

  constructor(opt: {
    // 该类型包含 BlockDesc 的所有属性，但排除了函数属性
    [K in keyof BlockDesc as BlockDesc[K] extends Function ? never : K]: BlockDesc[K]
  }) {
    this.head = opt.head
    this.foot = opt.foot
    this.outside = opt.outside
    this.inside = opt.inside
  }

  // 比较与另一个条件块之间的语义关系
  compareTo(other: BlockDesc) {
    // 互斥
    let x = this.inside & other.inside
    if ((x & Platforms.ALL_VUE) === 0) return -1
    if ((x & Platforms.ALL_TARGET) === 0) return -1

    // this 与 other 相同或者更宽
    if (x === other.inside) return 0

    // this 比 other 更窄
    return 1
  }

  toString() {
    let lineNum = this.head.start.line.toString().padStart(3, ' ')
    let mask = this.inside.toString(2).padStart(20, '0')
    return `${lineNum}: ${mask}`
  }
}
