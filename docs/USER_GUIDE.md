# Gym Management System — User Guide

## English

### 1. Purpose

Gym Management System is a desktop application for managing members, monthly subscriptions, payments, attendance, trainers, classes, equipment, reports, and operational notifications. It supports **English LTR** and **Arabic RTL** from the login and dashboard screens.

### 2. Installation and first launch

Install Node.js 20 or newer, clone the repository, and install dependencies:

```bash
git clone https://github.com/tahadeab/GYM-management-system.git
cd GYM_SYSTEM-2.0
npm install
```

Create a private environment file from the template:

```bash
cp .env.example .env
```

Set `ADMIN_PASSWORD` to a strong administrator password, then start the application:

```bash
npm start
```

The database is created in Electron's user-data directory. Customer information and database files should not be committed to GitHub.

### 3. Sign in and choose a language

Enter the administrator or staff credentials on the login screen. Use the language switcher to choose English or Arabic. The application updates the page direction automatically: English uses LTR and Arabic uses RTL. The preference is stored locally for future sessions.

Administrators can manage users and all gym records. Staff members see records within their permitted ownership scope and cannot perform administrator-only operations such as deleting users or freezing subscriptions.

### 4. Register a member

Open **Members**, select **Add Member**, and enter the member's name. Phone and email should be unique when provided. Add emergency contact information, medical notes, membership type, join date, and status. To create a monthly membership immediately, provide an expiry date. The system creates the member and subscription in one SQLite transaction; if subscription creation fails, the member creation is rolled back.

### 5. Manage monthly memberships

Open the subscription area or a member profile to review active, expiring, frozen, and expired subscriptions. A monthly renewal requires the member ID, duration in months, amount, and payment method. The system extends an active subscription from its current end date; otherwise, it creates a new active monthly subscription and payment record atomically.

Administrators can freeze a subscription until a selected date. A frozen subscription is excluded from expiration alerts. Use **Unfreeze** to restore the active state. The application exposes expiring memberships for configurable windows, including the default 30-day view and the urgent seven-day status.

### 6. Record payments

Use the payment workflow to record cash, card, transfer, or another configured method. Each payment is associated with a member and the staff user who processed it. Payment history is shown according to the current user's permissions, while administrators can review all gym payments.

### 7. Check attendance

Open **Attendance**, select a member, and choose an activity type. Add notes when needed and select **Check In**. When the visit ends, use **Check Out** for the open attendance record. The dashboard updates today's attendance and the member's last-visit timestamp.

### 8. Trainers, classes, and equipment

Use **Trainers** to create and update trainer profiles, specialties, contact details, and active status. Use **Classes** to schedule classes, assign trainers, set capacity and price, and book members. Use **Equipment** to track purchase details, availability, maintenance dates, and notes. Administrative deletion is protected by role checks.

### 9. Automatic notifications

The system checks active, non-frozen memberships and creates renewal reminders for memberships expiring within 30 days. Expired memberships receive an expiration notification. Duplicate notifications of the same type for the same member and user are prevented on the same day.

A sweep runs at application startup and then every 24 hours while the application is open. Staff can load unread notifications from the dashboard, mark individual notifications as read, and run a manual sweep when required. Notifications are stored in SQLite and linked to the responsible user and member.

### 10. Reports and dashboard

The dashboard provides member, trainer, attendance, revenue, payment, and expired-subscription indicators. Reports include revenue trends, attendance trends, and subscriptions approaching expiration. Use the filters before exporting or reviewing a report.

### 11. Export and backup

Use the export action to produce a JSON data backup before upgrades, migration, or major configuration changes. Store backups on a separate secure drive. Do not email or upload real customer data to public repositories. A backup should be restored and tested periodically in a non-production copy.

### 12. Troubleshooting

If the application does not start, run `npm install` again and verify the Node.js version. If login fails, confirm that `ADMIN_PASSWORD` is set before the first launch and check the application logs. If a notification is not visible, verify that the membership is active, not frozen, within the alert window, and associated with the current user. Run `npm run check` to validate JavaScript syntax.

### 13. Verification commands

```bash
npm run check
npm test
npm run test:e2e
```

Jest runs unit and integration tests. Playwright runs Electron end-to-end tests separately.

---

## العربية

### 1. الهدف من النظام

نظام إدارة الجيم هو تطبيق مكتبي لإدارة الأعضاء والاشتراكات الشهرية والمدفوعات والحضور والمدربين والحصص والمعدات والتقارير والتنبيهات التشغيلية. يدعم النظام **الإنجليزية باتجاه LTR** و**العربية باتجاه RTL** من شاشة الدخول ولوحة التحكم.

### 2. التثبيت والتشغيل الأول

ثبّت Node.js الإصدار 20 أو أحدث، ثم استنسخ المشروع وثبّت الاعتمادات:

```bash
git clone https://github.com/tahadeab/GYM-management-system.git
cd GYM_SYSTEM-2.0
npm install
```

أنشئ ملف الإعدادات الخاص بك:

```bash
cp .env.example .env
```

ضع كلمة مرور قوية للمسؤول في المتغير `ADMIN_PASSWORD`، ثم شغّل التطبيق:

```bash
npm start
```

يُنشئ التطبيق قاعدة البيانات داخل مجلد بيانات المستخدم الخاص بـ Electron. يجب عدم رفع بيانات العملاء أو ملفات قاعدة البيانات إلى GitHub.

### 3. تسجيل الدخول واختيار اللغة

أدخل بيانات المسؤول أو الموظف في شاشة الدخول. استخدم محوّل اللغة لاختيار العربية أو الإنجليزية. يغيّر التطبيق اتجاه الصفحة تلقائياً؛ فالإنجليزية تستخدم LTR والعربية تستخدم RTL، ويتم حفظ الاختيار للجلسات القادمة.

يستطيع المسؤول إدارة المستخدمين وجميع سجلات الجيم. أما الموظف فيرى السجلات ضمن نطاق الصلاحيات المسموح به، ولا يستطيع تنفيذ العمليات الإدارية مثل حذف المستخدمين أو تجميد الاشتراكات.

### 4. إضافة عضو جديد

افتح قسم **الأعضاء** ثم اختر **إضافة عضو** وأدخل اسم العضو. يجب أن يكون الهاتف والبريد الإلكتروني غير مكررين عند إدخالهما. أضف بيانات الطوارئ والملاحظات الطبية ونوع العضوية وتاريخ الانضمام والحالة. لإنشاء عضوية شهرية مباشرة، أدخل تاريخ انتهاء الاشتراك. ينشئ النظام العضو والاشتراك داخل معاملة SQLite واحدة، وإذا فشل إنشاء الاشتراك يتم التراجع عن إنشاء العضو تلقائياً.

### 5. إدارة العضويات الشهرية

افتح قسم الاشتراكات أو ملف العضو لمراجعة الاشتراكات النشطة والقريبة من الانتهاء والمجمّدة والمنتهية. يتطلب التجديد الشهري رقم العضو وعدد الأشهر والمبلغ وطريقة الدفع. يمدد النظام الاشتراك النشط من تاريخ انتهائه الحالي، أو ينشئ اشتراكاً شهرياً جديداً مع سجل دفع ضمن عملية ذرية واحدة.

يستطيع المسؤول تجميد الاشتراك حتى تاريخ محدد. يتم استبعاد الاشتراك المجمّد من تنبيهات الانتهاء. استخدم **إلغاء التجميد** لإعادته إلى الحالة النشطة. كما يوفر النظام قائمة بالاشتراكات القريبة من الانتهاء خلال مدة قابلة للتحديد، مع حالة عاجلة للاشتراكات التي ستنتهي خلال سبعة أيام.

### 6. تسجيل المدفوعات

استخدم نموذج المدفوعات لتسجيل الدفع النقدي أو البطاقة أو التحويل أو أي طريقة أخرى معتمدة. يرتبط كل دفع بعضو وبالموظف الذي عالجه. يعرض النظام سجل المدفوعات وفق صلاحيات المستخدم، بينما يستطيع المسؤول مراجعة جميع مدفوعات الجيم.

### 7. تسجيل الحضور

افتح قسم **الحضور** وحدد العضو ونوع النشاط، ثم أضف الملاحظات عند الحاجة واضغط **تسجيل الدخول**. عند انتهاء الزيارة استخدم **تسجيل الخروج** للسجل المفتوح. يحدّث النظام إحصائية حضور اليوم وتاريخ آخر زيارة للعضو.

### 8. المدربون والحصص والمعدات

استخدم قسم **المدربين** لإضافة وتعديل ملفات المدربين وتخصصاتهم وبيانات التواصل والحالة. استخدم قسم **الحصص** لجدولة الحصص وتعيين المدرب وتحديد السعة والسعر وحجز الأعضاء. استخدم قسم **المعدات** لتسجيل بيانات الشراء والحالة وتواريخ الصيانة والملاحظات. تخضع عمليات الحذف الإدارية للتحقق من الدور والصلاحية.

### 9. التنبيهات الآلية

يفحص النظام الاشتراكات النشطة وغير المجمّدة التي ستنتهي خلال 30 يوماً، وينشئ تنبيهات تذكير بالتجديد. كما ينشئ تنبيهاً للاشتراكات المنتهية. يمنع النظام تكرار التنبيه من النوع نفسه للعضو والمستخدم نفسيهما في اليوم نفسه.

يعمل الفحص عند تشغيل التطبيق ثم كل 24 ساعة ما دام التطبيق مفتوحاً. يستطيع الموظف تحميل التنبيهات غير المقروءة من لوحة التحكم، ووضع التنبيه كمقروء، وتشغيل الفحص يدوياً عند الحاجة. تحفظ التنبيهات في SQLite وترتبط بالمستخدم والعضو المسؤول عنه.

### 10. لوحة التحكم والتقارير

تعرض لوحة التحكم مؤشرات الأعضاء والمدربين والحضور والإيرادات والمدفوعات والاشتراكات المنتهية. وتشمل التقارير اتجاهات الإيرادات والحضور وقائمة الاشتراكات القريبة من الانتهاء. استخدم عوامل التصفية قبل مراجعة التقرير أو تصديره.

### 11. التصدير والنسخ الاحتياطي

استخدم وظيفة التصدير لإنشاء نسخة JSON قبل الترقية أو النقل أو تغيير الإعدادات المهمة. خزّن النسخ الاحتياطية في وسيط آمن منفصل. لا ترسل بيانات العملاء عبر البريد ولا ترفعها إلى مستودعات عامة. ينبغي اختبار استعادة النسخة دورياً على نسخة غير إنتاجية.

### 12. حل المشكلات

إذا لم يبدأ التطبيق، شغّل `npm install` مرة أخرى وتحقق من إصدار Node.js. إذا فشل تسجيل الدخول، تأكد من ضبط `ADMIN_PASSWORD` قبل التشغيل الأول وراجع سجلات التطبيق. إذا لم يظهر تنبيه، فتحقق من أن الاشتراك نشط وغير مجمّد وضمن فترة التنبيه وأنه مرتبط بالمستخدم الحالي. استخدم `npm run check` لفحص سلامة صياغة ملفات JavaScript.

### 13. أوامر التحقق

```bash
npm run check
npm test
npm run test:e2e
```

تشغل Jest اختبارات الوحدة والتكامل، بينما تشغل Playwright اختبارات Electron الشاملة بشكل منفصل.
