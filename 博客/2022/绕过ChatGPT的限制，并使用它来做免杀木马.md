---
title: 绕过ChatGPT的限制，并使用它来做免杀木马
tags:
  - 博客
  - ChatGPT
---

本文的目的是为了证明两件事：
1. 绕过 ChatGPT 现有的限制有多容易
2. 在不编写任何代码且仅使用 ChatGPT 的情况下创建高级恶意软件是多么容易

通过查看可以让 ChatGPT 生成什么来开始我的尝试。我决定使用 Go 实现语言，因为它易于开发，并且如果需要调试问题我可以手动检查代码。

# 第一个版本——构建 MVP(最小可行产品)

第一个提示是生成一些可执行的恶意软件；可以发现，ChatGPT 提醒我生成恶意软件是不道德的，并拒绝向我提供任何代码来帮助我进行这项工作。
![[Pasted image 20230410191631.png]]

为了解决这个问题，我决定不再预先向 ChatGPT 提出请求，而是决定生成一小段帮助程序代码，然后手动将整个可执行文件放在一起。我得出的结论是隐写术是数据外传的最佳方法，而通过搜索驱动器本身上已经存在的大型图像文件，“不落地”将是最佳方法。该恶意软件旨在针对特定的高价值个人，它可以在 C 驱动器上搜索高价值文档来支付红利，而不是冒着将外部文件带到设备上并被标记为调用 URL 的风险。

第一个成功的提示是简单地要求生成一些代码来搜索本地磁盘上大于 5MB 的 PNG。这里的设计决定是 5MB 的 PNG 足以存储高价值的商业敏感文档（如 PDF 或 DOCX）的片段。

![[Pasted image 20230410191722.png]]

有了查找大于 5MB 的 PNG 的代码，我将其复制回控制台，并要求 ChatGPT 添加一些代码，使用隐写术对找到的 PNG 进行编码。它轻松地建议 Auyer 的现成的隐写库来实现它 https://github.com/auyer/steganography

在这一点上，我几乎有了一个用于测试的 MVP，但难题的缺失部分是我需要在设备上找到一些要泄露的文件以及将结果上传到哪里。我决定提示 ChatGPT 给我一些代码，这些代码可以遍历用户的文档、桌面和 AppData 文件夹，以查找要泄露的任何 PDF 文档或 DOCX 文档。我确保在代码的第一次迭代中添加 1mb 的最大大小，以将整个文档嵌入到单个图像中。

对于数据外传，我认为 Google Drive 是一个不错的选择，因为在大多数公司网络中整个 Google 域往往是“允许列表”。
![[Pasted image 20230410191808.png]]

# 结合这些片段来创建我们的 MVP
使用提示组合代码片段是最简单的部分，因为我只需要发布我设法让 ChatGPT 生成并将它们组合在一起的代码片段。因此，有了 ChatGPT 结果，我现在有了一个 MVP，但它相对没用，因为任何“皇冠上的明珠”文档都可能大于 1MB，因此需要使用隐写术将其分成多个“块”以进行静默渗透。在四五个提示之后，我有了一些代码，可以将 PDF 分成 100KB 的块，并根据设备本地生成的 PNG 列表相应地生成 PNG。
![[Pasted image 20230410191827.png]]

# 测试 MVP
作为测试的一部分，我想看看开箱即用的代码与 Emotet 等现代攻击相比如何，以及是否有许多供应商会将 ChatGPT 生成的 EXE 视为恶意，所以我将 MVP 上传到 VirusTotal：
![[Pasted image 20230410191854.png]]

因此，在完全使用 ChatGPT 生成整个代码库后，我认为将 69 个文件中的五个供应商标记为恶意文件是一个不错的开始，但我们需要做得更好，以将其正确标记为零日攻击。

# 逃避检测的优化
最明显的优化是强制 ChatGPT 重构调用 Auyer 的 Steganographic 库的代码。我怀疑编译后的 EXE 中某处的 GUUID 或变量可能会提醒五家供应商将该文件标记为恶意文件。 ChatGPT 在我的本地应用程序中创建了我自己的 LSB 隐写术功能，而不必调用外部库，这方面做得非常出色。这将检测数量减少到两个供应商，但不是零供应商将文件标记为恶意文件的黄金数量。

对于最后两个供应商，我知道其中一个是领先的沙箱，另一个对可执行文件进行静态分析。考虑到这一点，我要求 ChatGPT 对代码进行两项新更改，一项是将有效启动延迟两分钟，因此假设要打开零日的假想企业用户不会在打开后立即注销.更改背后的逻辑是它会逃避监控功能，因为某些沙箱具有内置超时（出于性能原因），如果超时被打破，那么即使分析没有，它们也会以干净的判决作出响应。完成。
![[Pasted image 20230410191924.png]]

对于对 ChatGPT 的直接请求，都实施了一些保护措施，这意味着至少需要一定程度的能力才能弄清楚如何规避 ChatGPT 保护。

看到 ChatGPT 不支持我的直接请求，我决定再试一次。通过简单地将我的请求从要求它混淆代码，将提示更改为要求 ChatGPT 将所有变量更改为随机的英文名字和姓氏，它很乐意执行。作为一项额外的测试，我伪装了我的混淆请求以保护代码的知识产权，它再次生成了一些混淆变量名称的示例代码，并建议我可以使用相关的 Go 模块来生成完全混淆的代码。

这一变化背后的理论是，对于第二个供应商，我们需要逃避静态恶意软件分析，并且通过混淆代码有时可以逃避检测。 https://en.wikipedia.org/wiki/Obfuscation_(software) 但是，如果您混淆超出人类可读性，这有时会标记其他基于检测的工具，因为使用了不可读的变量名称。

因此，考虑到所有这些，我决定重新测试人为延迟和名字/姓氏变量：
![[Pasted image 20230410191949.png]]

因此，这些更改一切正常，让我们将其上传到 VirusTotal 并查看新结果：
![[Pasted image 20230410191958.png]]

我们终于得到它了，实现了免杀。只需使用 ChatGPT 提示，无需编写任何代码，我们就能够在短短几个小时内进行非常高级的攻击。如果没有基于 AI 的 Chatbot 所花费的时间，我估计可能需要 5 到 10 名恶意软件开发人员的团队花费数周时间，尤其是为了逃避所有基于检测的供应商。

我预计阅读这篇文章的一些人可能会说，这一切都很好，但我的端点工具将通过行为分析发现行为。但是，我针对两个行业领先的行为监控端点工具测试了两个版本的代码，在这两种情况下，我都能够运行可执行文件并成功将数据泄露到 Google Drive。这可能是由于代码表现出的非标准行为，而不是加密文件（勒索软件）或尝试将这些文件的副本发送到外部来源，而是将这些文件包装在低价值商品（图像）中并将其发送出去反而。

# 添加初始渗透机制

我意识到在这里结束解决方案会有点令人失望，因为我不会添加初始渗透机制。我决定让 ChatGPT 添加容器格式并自动调用 EXE。这没有用。在一些提示下，我设法说服 ChatGPT 生成有关如何将我的可执行文件嵌入 Windows 上的 SCR（屏幕保护程序）格式的说明，然后使 SCR 文件格式自动执行。

效果很好，所以我再次将结果上传到 VirusTotal：
![[Pasted image 20230410192049.png]]

对只有三个供应商将默认 SCR 文件标记为恶意文件感到失望，我决定将良性 SCR 文件上传到 VirusTotal。我再次检查结果，同样的三个供应商将良性 SCR 文件标记为恶意文件。这三个供应商很可能只是将所有 SCR 文件标记为恶意文件，而不是进行任何类型的智能检测。

我可以想象一个场景，其中 SCR 文件通过电子邮件发送给用户，并且他们经过社会工程来运行 SCR 文件，这就是运行可执行文件以静默泄露他们最敏感的文档的时候。这可能是高价值的个人，例如著名的政治家，或大型组织的高级成员，例如 C 级管理人员。

# 结论

总之，这种端到端的非常高级的攻击以前是为使用许多资源开发整个恶意软件的每个部分的民族国家攻击者保留的。尽管如此，在 ChatGPT 的帮助下，一名自认是新手的人已经能够在短短几个小时内创建出等效的恶意软件。这是一个令人担忧的发展，当前的工具集可能会因为 ChatGPT 出现的大量恶意软件而感到尴尬。

# 应对措施

虽然突出显示的示例仅显示您可以使用 ChatGPT 绕过现代防御的一种方法，但有几种方法可以减轻威胁。以下是 ChatGPT 自己关于防范这种攻击的建议：
![[Pasted image 20230410192125.png]]

# 来源
- https://www.forcepoint.com/blog/x-labs/zero-day-exfiltration-using-chatgpt-prompts

