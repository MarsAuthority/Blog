---
title: Google 基础设施安全设计
tags:
- 行业观察
- Google
- 面试
---

无意间看到一个小哥分享在Google求职的过程，里面关于面试这部分很有意思，记录如下：

# 1. Key Insight

- 面试通知邮件的指引非常清晰：提前了解候选人的背景/技术栈，根据个人情况来调整面试问题
- 硅谷大厂一般都喜欢问写代码的能力和system design，在Google这里也得到了确认

# 2. 面试确认邮件

![Sxnzub](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2022-12/Sxnzub.jpg)
![qh73sw](https://cdn.jsdelivr.net/gh/MarsAuthority/sec_pic@master/uPic/2022-12/qh73sw.jpg)

# 3. 面试问题

- 【考威胁建模】众所周知，图像解析库中存在安全问题（如 Buffer overflow），您必须设计一个解析图像的安全库，确保其中不存在安全漏洞，您将如何设计它？
- 【考安全架构/设计】为所有需要登录的谷歌服务（例如 youtube）设计单点登录系统
- 【考基础知识】如何在不使用编码和允许使用 javascript 的情况下防止 XSS？
- 【考个人经验】分享你的 fuzzing 经验？
- 【考基础知识】同源策略的起源是什么？

# 4. 来源

- [https://haiderm.com/my-experience-with-google-interview-for-information-security-engineer/](https://haiderm.com/my-experience-with-google-interview-for-information-security-engineer/)