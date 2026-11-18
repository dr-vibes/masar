# سجل التغييرات الرئيسي الإلزامي — مسار

> **هذا الملف مصدر الحقيقة التاريخية الوحيد لكل تغيير مستقبلي في البرنامج أو البنية أو عمليات AWS/DNS/الأمان.** كل تنفيذ جديد يتطلب قيدًا هنا في الجلسة نفسها. اتبع `docs/CHANGE_TEMPLATE_AR.md` وقواعد `AGENTS.md`. لا تضع أسرارًا أو معلومات عملاء. السجلات التاريخية الأقدم المفصلة موجودة في `docs/HISTORY_AR.md`.

## التغييرات (الأحدث أولًا)

### CHG-20261118-03 - Documentation transfer guide correction
- Date: 2026-11-18
- Scope: docs/INSTALL_DOCS_AR.md
- Corrected the outdated AWS documentation transfer status.
- Confirmed documentation is merged into the AWS source project.
- GitHub push has not been performed.
- Historical transfer instructions retained for reference.
- No application deployment or Nginx changes.

### CHG-20261118-02 - GitHub ignore rules hardening
- Date: 2026-11-18
- Scope: .gitignore
- Added exclusions for build caches, private keys, backups, databases, and data exports.
- Existing ignore rules preserved.
- Backup: ~/deployments/masar-gitignore-before-github.bak
- Verified: New rules appeared in .gitignore.
- Pending: Git tracked-file audit, secret scan, and GitHub readiness review.
- No application deployment or GitHub push performed.

### CHG-20261118-01 - AWS Elastic IP migration
- Date: 2026-11-18
- Previous public IP: 52.56.136.16
- Current AWS Elastic IP: 18.170.245.85
- Domain: masar.ah-nova.tech
- Cloudflare DNS A record updated.
- HTTPS verified using curl --resolve.
- HTTP 401 confirmed Nginx Basic Auth protection.
- AWS runbook updated with the current IP.
- Historical event recorded as H-23.
- No application code deployment or GitHub push.
- Next: Update HANDOFF_AR.md and audit GitHub readiness.

### CHG-20261117-02 — دمج نظام التوثيق على AWS
- **التاريخ:** 2026-11-17؛ **المنفذ:** المستخدم بتوجيه مساعد AI.
- **الحالة:** مكتمل ومختبر داخل المصدر على AWS؛ لم يُدفع إلى GitHub ولم يُنشر إصدار جديد للموقع.
- **الهدف:** اعتماد توثيق دائم وخريطة تطوير وسجل تغييرات إلزامي.
- **النطاق:** إضافة AGENTS.md وCHANGELOG.md وPROJECT_CONTEXT_AR.md ومجلد docs/ وفاحص التوثيق وإعدادات GitHub Actions، وتحديث README.md وDEVELOPMENT_PLAN_AR.md وpackage.json.
- **الإجراءات:** مراجعة الفروق، إنشاء نسخة احتياطية، دمج الملفات باستخدام rsync.
- **الاختبارات:** npm run docs:check ناجح (13 ملفًا)، npm test ناجح (15 ملفًا)، npm run build ناجح (43 وحدة).
- **النسخة الاحتياطية:** ~/deployments/masar-source-before-docs-2026-11-17.tar.gz
- **المخاطر:** يلزم تحديث وثيقة تسليم السياق ودفع التعديلات إلى GitHub لاحقًا.
- **التراجع:** استعادة المصدر من الأرشيف الاحتياطي بعد مراجعة الملفات، دون المساس بمجلد الإنتاج.
- **الخطوة التالية:** تحديث docs/HANDOFF_AR.md ثم إعادة فحص التوثيق.



### CHG-20261117-01 — إنشاء إطار التوثيق والسياق المستمر
- **التاريخ:** 2026-11-17؛ **المنفذ:** مساعد AI؛ **الحالة:** تم إنشاء ملفات محلية داخل نسخة المشروع؛ **لم تُنشر على AWS ولم يُثبت دفعها إلى GitHub**.
- **الهدف:** جعل خطة مسار، معمارية الحسابات والإيجارات، ومراحل نشر AWS ومستوى الأمان والتغييرات والقرارات قابلة للاستئناف دون الاعتماد على المحادثة.
- **النطاق:** إضافة `AGENTS.md`, `PROJECT_CONTEXT_AR.md`, `CHANGELOG.md`, وثائق `docs/` وقالب PR وفاحص توثيق `scripts/validate-documentation.mjs` وGitHub Actions للجودة، وتحديث فهرس `README.md` والخطة الحالية لربطها بالمراجع.
- **الدليل:** فحص `npm run docs:check` للتحقق من الملفات؛ CI المقترح يرفض طلب دمج لم يحدّث السجل والتسليم، ويشغّل اختبارات المصدر والبناء. الملفات تكتب محليًا في المصدر المُستخرج من `MASAR_Personal_Brokerage_Workspace_v2.zip`، وتُفحص روابطها ومحتواها؛ دون تعديل آلية تشغيل التطبيق.
- **المخاطر:** قد تختلف ملفات المصدر المرفوعة على AWS أو GitHub عن الأرشيف المستخدم هنا؛ أي دمج يجب أن يكون آمنًا ومتحققًا منه.
- **التراجع:** حذف ملفات التوثيق الجديدة أو استعادة الأرشيف الأصلي بعد حفظ نسخة، دون لمس ملفات الإنتاج والبيانات.
- **الخطوة التالية:** فحص `curl -I https://masar.ah-nova.tech` بعد تحديث Ubuntu ثم تأكيد اكتمال الخطوة؛ وبعد ذلك دمج الوثائق فقط في المصدر الحي/المستودع.

### CHG-20261117-BASELINE — ملخص حالة V2 السابقة والتأسيس (توثيق رجعي)
- **التاريخ:** 2026-11-17؛ **الحالة:** تم تجميعه من المصدر ومخرجات المستخدم؛ ليس تتبع Git أصليًا لكل commit.
- **المصدر:** نسخة V2 تتضمن حاسبة التمويل حسب حالة العميل وقواعد البنك، متابعة ملفات التمويل، وتحصيل الإيجارات مع `localStorage` واختبارات منطقية. نجحت الاختبارات والبناء على Ubuntu، ونُشرت الواجهة على AWS EC2/Nginx ودومين Cloudflare وشهادة HTTPS وحماية Basic Auth؛ اختبارات تجديد الشهادة ناجحة.
- **التحفظ:** النظام لا يمتلك مصادقة داخل التطبيق أو قاعدة بيانات؛ الحسابات تقديرية وغير معتمدة؛ آخر تحديث Ubuntu يحتاج تحققًا نهائيًا؛ ثغرتا npm متوسطتا الخطورة ما زالتا دون معالجة موثقة.
- **التفاصيل الدقيقة:** `docs/HISTORY_AR.md` للأحداث H-01 حتى H-22، و`docs/AWS_RUNBOOK_AR.md` للتشغيل.

## القاعدة الثابتة للقيود المقبلة
- أضف قيدًا **فور كل تغيير**، سواء نجح أو فشل، وتميّز فيه بين المصدر المحلي وGitHub وخادم AWS.
- عند نشر فعلي، ضع تاريخ النشر ورقم commit/الإصدار إن وجد، واختبارات الموقع والإجراءات القابلة للتراجع.
- عند عدم التحقق اكتب «غير مؤكد» بدل «تم».
- تحديث `docs/HANDOFF_AR.md` إلزامي بعد الجلسة، و`docs/ROADMAP_AR.md` عند تغيّر حالة مرحلة.
