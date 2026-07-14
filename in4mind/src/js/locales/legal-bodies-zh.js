'use strict';

/** 简体中文法律页面正文 — 当语言为 zh 时注入 */
const LEGAL_BODIES_ZH = {
  terms: `<p class="legal-main__meta">最后更新：2026 年 5 月 29 日</p>
    <h1>使用条款</h1>
    <p class="legal-main__intro">欢迎使用 IN4MIND。访问或使用我们的教育平台即表示您接受这些条款。请在注册或使用服务前仔细阅读。</p>
    <h2>1. 服务目的</h2>
    <p>IN4MIND 是一个在线学习平台，提供课程、测验、教育内容以及人工智能助手，用于技术、编程、网络安全及相关领域的教育目的。</p>
    <h2>2. 注册与账户</h2>
    <p>要使用某些功能，您必须创建账户。您同意：</p>
    <ul>
      <li>提供真实、最新的信息。</li>
      <li>对登录凭据保密。</li>
      <li>如发现账户被未经授权使用，立即通知我们。</li>
      <li>未经授权不得与第三方共享您的账户。</li>
    </ul>
    <h2>3. 允许的使用</h2>
    <p>您可将 IN4MIND 用于个人学习、职业培训以及经授权的工作场所或学术用途。以下行为被禁止：</p>
    <ul>
      <li>未经明确许可复制、转售或再分发内容。</li>
      <li>试图访问受限系统、数据或平台区域。</li>
      <li>将平台用于非法、欺诈活动或侵犯第三方权利的行为。</li>
      <li>滥用自动化访问（抓取、未经授权的机器人等）。</li>
      <li>欺诈性操纵测验、进度或认证。</li>
    </ul>
    <h2>4. 内容与知识产权</h2>
    <p>IN4MIND 的文本、设计、标识、视频、练习及其他材料受知识产权法保护。您获得在平台内为学习目的查看内容的有限、非独占、不可转让许可。</p>
    <h2>5. AI 助手</h2>
    <p>AI 助手生成的回复仅供指导和教育用途，不能替代专业、法律或专业技术建议。在生产或关键环境中应用信息前，您有责任自行核实。</p>
    <h2>6. 可用性与变更</h2>
    <p>我们努力保持平台正常运行，但不保证服务不间断。我们可能更新功能、内容或这些条款。重大变更将在平台或通过电子邮件（如适用）通知您。</p>
    <h2>7. 责任限制</h2>
    <p>IN4MIND 按「现状」提供。在法律允许的范围内，我们不对因使用或无法使用服务而产生的间接损害、数据丢失或伤害承担责任，除非存在 IN4MIND 的故意或重大过失。</p>
    <h2>8. 暂停与终止</h2>
    <p>若您违反这些条款或我们发现危及平台或其他用户的行为，我们可暂停或取消您的访问权限。您可随时停止使用服务。</p>
    <h2>9. 适用法律</h2>
    <p>这些条款受您居住司法管辖区适用法律管辖；如无则适用服务提供商相关规则。咨询请联系：<a href="mailto:soporte@in4mind.app">soporte@in4mind.app</a>。</p>
    <nav class="legal-nav" aria-label="法律文档">
      <a href="terminos.html" class="is-active">使用条款</a>
      <a href="privacidad.html">隐私</a>
      <a href="cookies.html">Cookie</a>
    </nav>`,

  privacy: `<p class="legal-main__meta">最后更新：2026 年 5 月 29 日</p>
    <h1>隐私政策</h1>
    <p class="legal-main__intro">IN4MIND 尊重您的隐私。本政策说明我们收集哪些数据、如何使用以及您对个人信息的权利。</p>
    <h2>1. 数据控制者</h2>
    <p>通过 IN4MIND 收集的个人数据的控制者为平台所有者。联系：<a href="mailto:privacidad@in4mind.app">privacidad@in4mind.app</a>。</p>
    <h2>2. 我们收集的数据</h2>
    <p>我们可能处理以下类别的数据：</p>
    <ul>
      <li><strong>账户数据：</strong>姓名、电子邮件和密码（安全存储）。</li>
      <li><strong>使用数据：</strong>课程进度、测验结果、导航偏好和视觉主题。</li>
      <li><strong>技术数据：</strong>IP 地址、浏览器类型、设备及用于安全的活动日志。</li>
      <li><strong>AI 对话：</strong>您发送给助手的消息，用于生成教育性回复。</li>
      <li><strong>通信：</strong>您通过联系或支持表单发送给我们的消息。</li>
    </ul>
    <h2>3. 处理目的</h2>
    <p>我们使用您的数据以：</p>
    <ul>
      <li>管理您在平台上的注册和身份验证。</li>
      <li>个性化您的学习体验并记住您的进度。</li>
      <li>提供 AI 助手服务并提高回复的教育质量。</li>
      <li>确保安全、防止欺诈并履行法律义务。</li>
      <li>在您自愿订阅时发送信息性通信。</li>
    </ul>
    <h2>4. 法律依据</h2>
    <p>处理基于服务合同履行（用户账户）、您的同意（新闻通讯、非必要 Cookie）、合法利益（安全与服务改进）以及适用法律要求时的法律义务。</p>
    <h2>5. 数据保留</h2>
    <p>我们在您的账户活跃期间保留数据，并在履行法律义务或解决索赔所需的期限内保留。匿名化的使用数据可能为统计目的而保留。</p>
    <h2>6. 接收方与传输</h2>
    <p>我们不出售您的个人数据。我们可能与技术提供商（托管、分析、AI API）共享，他们作为处理者并受保密协议约束。若任何提供商位于欧洲经济区以外，我们将根据适用法规采取适当保障措施。</p>
    <h2>7. 您的权利</h2>
    <p>您有权：</p>
    <ul>
      <li>访问、更正和删除您的个人数据。</li>
      <li>限制或反对某些处理。</li>
      <li>在适用情况下请求数据可移植性。</li>
      <li>随时撤回同意，不影响撤回前的处理。</li>
      <li>向您所在国家的数据保护机构提出投诉。</li>
    </ul>
    <p>行使权利请写信至 <a href="mailto:privacidad@in4mind.app">privacidad@in4mind.app</a>。</p>
    <h2>8. 安全</h2>
    <p>我们采取合理的技术和组织措施，保护您的数据免遭未经授权的访问、丢失或篡改。没有任何系统是 100% 无懈可击的；建议使用强密码且不要共享。</p>
    <h2>9. 未成年人</h2>
    <p>IN4MIND 主要面向 16 岁以上用户。若您为未成年人，注册需获得法定监护人授权。</p>
    <h2>10. 政策变更</h2>
    <p>我们可能更新本政策以反映法律或服务变更。修订版将发布在本页并注明更新日期。</p>
    <nav class="legal-nav" aria-label="法律文档">
      <a href="terminos.html">使用条款</a>
      <a href="privacidad.html" class="is-active">隐私</a>
      <a href="cookies.html">Cookie</a>
    </nav>`,

  cookies: `<p class="legal-main__meta">最后更新：2026 年 5 月 29 日</p>
    <h1>Cookie 政策</h1>
    <p class="legal-main__intro">本政策说明 IN4MIND 如何使用 Cookie 及类似技术（如 localStorage）来改善您的体验并记住您的偏好。</p>
    <h2>1. 什么是 Cookie？</h2>
    <p>Cookie 是您访问网站时存储在浏览器中的小型文本文件。IN4MIND 还使用浏览器 <strong>localStorage</strong> 和 <strong>sessionStorage</strong> 在您的设备本地保存偏好和会话数据。</p>
    <h2>2. IN4MIND 使用哪些？</h2>
    <p>我们目前使用以下类别：</p>
    <h2>严格必要的 Cookie 与存储</h2>
    <p>平台基本运行所必需：</p>
    <ul>
      <li><strong>in4mind_theme</strong>（localStorage）— 记住浅色或深色模式偏好。</li>
      <li><strong>in4mind_sidebar_collapsed</strong>（localStorage）— 保存侧边栏菜单状态。</li>
      <li><strong>in4mind_locale</strong>（localStorage）— 记住您的语言偏好（ES/EN/中）。</li>
      <li><strong>in4mind_open_course</strong>（sessionStorage）— 登录时选中的课程。</li>
      <li>身份验证后的用户会话数据（进度、账户偏好）。</li>
    </ul>
    <h2>偏好 Cookie</h2>
    <p>记住语言、视觉主题或面板布局等设置，以免每次访问都需重新配置。</p>
    <h2>分析 Cookie（可选）</h2>
    <p>若未来引入分析工具，我们将事先告知并在法律要求时请求您的同意。这些 Cookie 以汇总、匿名形式帮助我们了解平台使用情况。</p>
    <h2>3. 第三方 Cookie</h2>
    <p>部分内容可能加载外部资源（例如 Google Fonts 或演示图片）。这些提供商可能根据其政策设置自己的 Cookie。建议查阅其隐私政策。</p>
    <h2>4. 持续时间</h2>
    <ul>
      <li><strong>会话：</strong>关闭浏览器时删除（sessionStorage）。</li>
      <li><strong>持久：</strong>保留至过期或手动删除（localStorage、主题偏好）。</li>
    </ul>
    <h2>5. 如何管理或删除 Cookie</h2>
    <p>您可通过浏览器设置控制 Cookie：</p>
    <ul>
      <li>阻止或删除现有 Cookie。</li>
      <li>在接受 Cookie 前设置警告。</li>
      <li>清除特定网站的数据（包括 localStorage）。</li>
    </ul>
    <p>禁用必要 Cookie 可能影响 IN4MIND 功能（例如无法记住您偏好的主题或菜单状态）。</p>
    <h2>6. 同意</h2>
    <p>继续浏览并使用需要本地存储的功能，即表示您接受本政策所述的 Cookie 及类似技术的使用，除非您将浏览器配置为拒绝它们。</p>
    <h2>7. 更多信息</h2>
    <p>了解我们如何处理您的个人数据，请参阅<a href="privacidad.html">隐私政策</a>。问题请联系：<a href="mailto:privacidad@in4mind.app">privacidad@in4mind.app</a>。</p>
    <nav class="legal-nav" aria-label="法律文档">
      <a href="terminos.html">使用条款</a>
      <a href="privacidad.html">隐私</a>
      <a href="cookies.html" class="is-active">Cookie</a>
    </nav>`,
};
