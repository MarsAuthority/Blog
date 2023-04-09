---
title: Security.News@202207
tags:
  - 安全通讯 Security.News
  - 行业动态
  - 供应链安全
  - 友商动态
  - 安全演习
  - Github
  - Microsoft
  - 安全加固
---

## 行业动态
### Cyber Europe 2022:欧盟完成大规模网络战演习

来自欧洲各地的网络安全专家刚刚完成了迄今为止规模最大的国际网络危机模拟之一;Cyber Europe 2022有来自欧盟和欧洲自由贸易区(EFTA)29个国家的800多名网络安全专家以及欧盟机构和部门参加。

- 第一天演习内容包括**篡改实验室结果等虚假宣传活动**，以及**对欧洲医院网络发动攻击**。
- 第二天演习的安全事件进一步升级为欧盟范围内。有**攻击者威胁将发布个人医疗数据**，而另一个团伙则**在网上散布植入式医疗设备存在漏洞的谣言**。
- 此次演习测试了各参与方的事件响应能力，以及欧盟各机构与欧洲计算机应急响应小组（CERT-EU）、欧盟网络与信息安全局（ENISA）合作提高态势感知能力的成效。此次演习中吸取的经验教训，将在ENISA发布的事后报告中正式公布。

#### 一些感悟
> 因为疫情原因，2020年的演习延期到2022年才进行，这种涉及29个国家的网络战演习组织难度一定很大，可以期待下2022年的事后报告公布。
>
> 2018年的事后报告可以看[这里](https://www.enisa.europa.eu/publications/cyber-europe-2018-after-action-report/at_download/fullReport#:~:text=Cyber%20Europe%202018%20was%20the,and%20Information%20Security%20(ENISA).)，有空的话我也会进行解读。

#### 参考资料
- https://portswigger.net/daily-swig/cyber-europe-2022-eu-completes-large-scale-cyber-war-game-exercise
- https://www.enisa.europa.eu/topics/cyber-exercises/cyber-europe-programme/cyber-europe-2022

## 供应链安全
### 针对工业系统的恶意密码破解软件

恶意攻击者正在使用含有木马程序的可编程序控制器密码破解工具来感染工业系统。来自 Dragos 的研究人员分析了一个恶意密码破解工具，其中包含恶意软件 Sality，它将被感染的系统集中成僵尸网络的一部分。

#### 一些感悟
> 从未经审查的来源下载软件并运行可能很危险，谁知道有没有鬼在里面呢？比如：网上的各种破解软件……

#### 参考资料
- https://www.dragos.com/blog/the-trojan-horse-malware-password-cracking-ecosystem-targeting-industrial-operators/

### 欺骗的 GitHub 提交元数据为软件供应链攻击创造了可能

来自 Checkmarx 的研究人员表示，伪造的元数据可能被用来欺骗开发人员使用包含恶意代码的存储库。开发人员需要对验证与提交相关的身份保持警惕。

Git 版本控制系统的核心功能之一是提交。

正如[这里](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/about-commits)所指出的，除了数据本身(即对代码的更改)之外，提交还包括元数据。这个元数据以时间戳和创建者身份的形式出现。问题是两者都可以伪造：

1. **伪造提交时间**

    **利用场景**

    由于缺乏对时间戳的验证，恶意用户可以通过使其看起来已经非常活跃很长时间来显得可信。

    GitHub 上用户活动的一个重要衡量标准是在用户个人资料页面上显示的“活动图”。这个图本质上是一个显示用户活动时间的热图。因此，如果我们能够使用我们想要的任何时间戳来制造提交，我们就可以用伪造的活动来填充这个图。

2. **伪造贡献者**

    **利用场景**

    正如几周前 Aqua 所显示的，NPM 包管理器允许包所有者在他们的包中添加任何他们想要的贡献者，并通过这样做来提高他们的项目声誉和可信度。

    通过欺骗提交者的身份，GitHub 存储库也可以做到这一点。为了使他们的项目看起来可靠，攻击者可以使用这种技术一次或多次，并用已知的可靠贡献者填充存储库的贡献者部分，这反过来又使项目看起来可靠。

#### 一些感悟
> GitHub 提供了一个安全特性来解决这个问题，允许开发人员在提交代码时验证他们的身份，但这更依赖于开发人员的安全意识和积极参与。

#### 参考资料
- https://checkmarx.com/blog/unverified-commits-are-you-unknowingly-trusting-attackers-code/

## 友商动态
### 微软关闭了两种攻击途径: Office 宏和 RDP 暴力破解

这家企业 IT 巨头的政策是在下载的 Office 文档中默认屏蔽 Visual Basic for Applications (VBA)宏，但在短暂停顿之后，该政策再次被激活，以回应那些在安全防御方面遇到困难的用户的反馈。

同样在本周，微软在 Windows 11中启用了一个默认设置，该设置旨在阻止或减缓明显的远程桌面协议(Remote Desktop Protocol，RDP)暴力破解攻击；在10次不正确的登录尝试后，帐户将被锁定10分钟。在 Windows10中可以使用帐户锁定设置，但默认情况下不启用该设置。

#### 参考资料
- https://www.theregister.com/2022/07/22/microsoft-windows-vba-macros/

