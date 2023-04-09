---
title: WAF能力评估&测试
tags:
- Blue Team基础设施
- Web应用防火墙
- 机器学习
- Cloudflare
---

# 1. 背景
Cloudflare 每秒处理3200 万次 HTTP 请求，22% web 服务器为 [W3Techs](https://w3techs.com/technologies/details/ws-cloudflare) 所知的网站使用 Cloudflare。Cloudflare 为五分之一的互联网资产保护其流量，因而具备独特的优势，得以在威胁出现时就加以识别，并跟踪其进化和变异。

Web 应用程序防火墙（WAF）处于 Cloudflare 安全工具箱的核心位置，而托管规则是 [WAF](https://www.cloudflare.com/zh-cn/learning/ddos/glossary/web-application-firewall-waf/) 的关键功能。托管规则是 Cloudflare 分析师团队创建的一组规则，用于阻止显示已知攻击模式的请求。这些托管规则攻击对于现有攻击手段的模式非常有效，因为它们已经过广泛测试，能最大限度减少误报。托管规则的不足之处是，常常会错过攻击的变体（也称为绕过），因为基于静态正则表达式的规则本质上对引入的特征变体（如通过模糊技术）敏感。

在[[log4j]]漏洞爆发的时候，由于攻击者尝试绕过 WAF，Cloudflare必须不断更新规则来匹配变种。此外，优化规则需要大量的人工干预，而且通常要在绕过被识别或甚至被利用后才能起作用，导致保护变得被动。

为了解决这个问题，Cloudflare提供一个新工具，旨在无需人工干预的情况下识别绕过和恶意负载，以防其造成破坏。现在客户能够从一个机器学习模型中获取信号，这个模型根据托管规则和分类的善意/恶意流量和增强数据来训练，从而针对更大范围的新老攻击提供更佳的保护。

# 2. 第一个自我学习的 WAF
全新检测系统增强现有的托管规则集，提供三大优势：
1.  适用于您的所有流量。系统会根据每个请求包含 SQLi 或 XSS 攻击等的可能性对其进行评分。这实现了一种全新的 WAF 分析体验，让您能够探索自己整体流量中的趋势和模式。
2.  检测速率根据过去的流量和反馈而改善。托管规则集将所有 Cloudflare 流量分类为善意/恶意流量后，提供给该模型进行训练。这样一来，小型网站也能获得与大型网站同级的保护。
3.  性能的新定义该机器学习模型在绕过和异常被利用或被人类研究人员识别前就将其识别出来。

其中秘诀在于如下几方面的结合：创新的机器学习建模，庞大的训练数据集（基于我们每天阻止的攻击，以及数据增强技术），基于行为测试原则的正确评估和测试框架，以及让我们在几乎毫不增加延迟的前提下评估每一个请求的尖端工程技术。

# 3. 新的 WAF 体验
全新检测系统基于与[机器人分析（Bot Analytics）](https://blog.cloudflare.com/introducing-bot-analytics/) 一同发布的范式。根据这一方法，无论我们是否采取行动，都会对每个请求进行评估并赋分。由于我们对每一个请求赋分，针对发送到用户服务器的全部流量，用户能够看到分数如何随着时间变化。

![3STXCU](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-01/3STXCU.jpg)

此外，用户还可以查看请求的特定攻击手段（如SQLi的）评分直方图，并找到合适的评分值来区分善意流量和恶意流量。配置的规则如下图：

![tVmqXg](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-01/tVmqXg.jpg)

# 4. 工作原理

基于机器学习的检测补充了现有的托管规则集，例如 OWASP 和 Cloudflare 托管规则。这套系统基于旨在没有研究人员或最终用户直接监督的情况下识别攻击模式变体或异常的模型。

截至今日，Cloudflare已经公开两种攻击手段的分数：SQL 注入（SQLi）和跨站点脚本（XSS）。用户能根据三个单独的分数来创建自定义 WAF/防火墙规则：总分 （`cf.waf.ml.score`），SQLi 分数和 XSS 分数（分别为 `cf.waf.ml.score.sqli`，`cf.waf.ml.score.xss`,）。这些分数介于 1-99，其中 1 为绝对恶意，99 代表有效流量。

![CSU2ZS](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-01/CSU2ZS.jpg)

然后，我们使用现有 WAF 规则分类的流量对该模型进行训练，它对原始请求的一个变异版本有效，使其更容易识别攻击的指纹。

对于每个请求，该模型对请求的每个部分独立评分，从而有可能识别恶意负载所在的位置，例如，在请求的正文、URI 或标头中。

![EZsUM7](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2023-01/EZsUM7.jpg)

这看起来很简单，但 Cloudflare 的工程师需要解决一系列挑战才能做到。其中包括：如何建立一个可靠的数据集，可扩展的数据标签，选择正确的模型架构，以及要求对 Cloudflare 全球网络处理的每一个请求（每秒 3200 万个）执行分类。

# 5. 参考资料
- [通过机器学习改善 WAF (cloudflare.com)](https://blog.cloudflare.com/zh-cn/waf-ml-zh-cn/)