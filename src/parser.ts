import * as vscode from 'vscode'

import {
  BlockDesc,
  Mask,
  Platforms,
  PlatformName,
} from './base'

// 用给定的正则表达式对一个代码行进行分析，用于识别并提取出条件编译语句
class TokenMatch {
  cond: string
  lineNum: number
  startCharacter: number
  endCharacter: number

  constructor(cond: string, lineNum: number, startCharacter: number, endCharacter: number) {
    this.cond = cond
    this.lineNum = lineNum
    this.startCharacter = startCharacter
    this.endCharacter = endCharacter
  }

  toRange() {
    return new vscode.Range(this.lineNum, this.startCharacter, this.lineNum, this.endCharacter)
  }

  static match(line: vscode.TextLine, re: RegExp) {
    let m = line.text.match(re)
    if (!m) return
    return new TokenMatch(
      m[1],
      line.lineNumber,
      m.index!,
      m.index! + m[0].length,
    )
  }
}

export type DocumentParserOptions = {
  hasTemplate?: boolean,
  hasScript?: boolean,
  hasCss?: boolean,
}

export class DocumentParser extends Array<BlockDesc> {
  options: DocumentParserOptions

  constructor(options: DocumentParserOptions) {
    super()
    this.options = options
  }

  parse(document: vscode.TextDocument) {
    let blocks = []
    let curMask = Platforms.ALL
    for (let lineNum = 0; lineNum < document.lineCount; lineNum++) {
      const line = document.lineAt(lineNum)

      if (this.options.hasTemplate) {
        // <!-- #ifdef XXX || YYY -->
        let tm = TokenMatch.match(line, /<!--\s*#ifdef\s*(.*)\s*-->/)
        if (tm) {
          let block = this.openDefBlock(tm, curMask)
          blocks.push(block)
          this.push(block)
          curMask = block.inside
          continue
        }

        // <!-- #ifndef XXX || YYY -->
        tm = TokenMatch.match(line, /<!--\s*#ifndef\s*(.*)\s*-->/)
        if (tm) {
          let block = this.openNdefBlock(tm, curMask)
          blocks.push(block)
          this.push(block)
          curMask = block.inside
          continue
        }

        // <!-- #endif -->
        tm = TokenMatch.match(line, /<!--\s*#endif\s*-->/)
        if (tm) {
          let block = this.pop()
          if (!block) return
          curMask = this.closeBlock(tm, block)
          continue
        }
      }

      if (this.options.hasScript) {
        // // #ifdef XXX || YYY
        let tm = TokenMatch.match(line, /\/\/\s*#ifdef\s*(.*)/)
        if (tm) {
          let block = this.openDefBlock(tm, curMask)
          blocks.push(block)
          this.push(block)
          curMask = block.inside
          continue
        }

        // // #ifndef XXX || YYY
        tm = TokenMatch.match(line, /\/\/\s*#ifndef\s*(.*)/)
        if (tm) {
          let block = this.openNdefBlock(tm, curMask)
          blocks.push(block)
          this.push(block)
          curMask = block.inside
          continue
        }

        // // #endif
        tm = TokenMatch.match(line, /\/\/\s*#endif/)
        if (tm) {
          let block = this.pop()
          if (!block) return
          curMask = this.closeBlock(tm, block)
          continue
        }
      }

      if (this.options.hasCss) {
        // /* #ifdef XXX || YYY */
        let tm = TokenMatch.match(line, /\/\*\s*#ifdef\s*(.*)\*\//)
        if (tm) {
          let block = this.openDefBlock(tm, curMask)
          blocks.push(block)
          this.push(block)
          curMask = block.inside
          continue
        }

        // /* #ifndef XXX || YYY */
        tm = TokenMatch.match(line, /\/\*\s*#ifndef\s*(.*)\*\//)
        if (tm) {
          let block = this.openNdefBlock(tm, curMask)
          blocks.push(block)
          this.push(block)
          curMask = block.inside
          continue
        }

        // /* #endif */
        tm = TokenMatch.match(line, /\/\*\s*#endif\s*\*\//)
        if (tm) {
          let block = this.pop()
          if (!block) return
          curMask = this.closeBlock(tm, block)
          continue
        }
      }
    }

    return blocks
  }

  // 开始一个 #ifdef 条件块
  openDefBlock(tm: TokenMatch, curMask: Mask) {
    let platforms = tm.cond.split('||').map(platform => platform.trim())
    let mask = 0
    for (let platform of platforms) {
      mask |= Platforms[platform]
    }
    let block = new BlockDesc({
      head: tm.toRange(),
      foot: tm.toRange(),
      outside: curMask,
      inside: curMask & mask,
    })
    return block
  }

  // 开始一个 #ifndef 条件块
  openNdefBlock(tm: TokenMatch, curMask: Mask) {
    let platforms = tm.cond.split('||').map(platform => platform.trim())
    let mask = 0
    for (let platform of platforms) {
      if (platform === 'VUE2' || platform === 'VUE3') {
        mask |= Platforms[platform] & Platforms.ALL_VUE
      } else {
        mask |= Platforms[platform] & Platforms.ALL_TARGET
      }
    }
    mask ^= Platforms.ALL
    let block = new BlockDesc({
      head: tm.toRange(),
      foot: tm.toRange(),
      outside: curMask,
      inside: curMask & mask,
    })
    return block
  }

  // 结束一个条件块
  closeBlock(tm: TokenMatch, block: BlockDesc) {
    block.foot = tm.toRange()
    return block.outside
  }
}
