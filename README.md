# حساب القهوة — Sakary Café (MERN)

تطبيق إدارة طاولات وطلبات الكافيه. مبني على MERN Stack مع واجهة عربية (RTL) و Mobile-first.

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose

> ملاحظة: ملف `index.html` في الجذر هو النسخة الأولى الساكنة (prototype) اللي اترفعت على Vercel. النسخة الكاملة MERN موجودة في `server/` و `client/`.

## 📁 بنية المشروع

```
.
├── index.html                  # (legacy) النسخة الساكنة الأولى
├── server/                     # Express + Mongoose API
│   ├── server.js               # نقطة تشغيل السيرفر + ربط الراوتس
│   ├── config/db.js            # اتصال MongoDB
│   ├── models/                 # Mongoose models
│   │   ├── Menu.js
│   │   ├── Table.js
│   │   ├── Customer.js
│   │   └── Order.js
│   ├── routes/                 # CRUD endpoints
│   │   ├── menu.js
│   │   ├── tables.js
│   │   ├── customers.js
│   │   ├── orders.js
│   │   └── admin.js
│   ├── utils/build.js          # تجميع الشجرة (tables→customers→orders) وحساب الإجماليات
│   ├── seed.js                 # إدخال القائمة الافتراضية
│   └── .env.example
└── client/                     # React app
    ├── vite.config.js          # proxy /api -> :5000
    ├── tailwind.config.js
    └── src/
        ├── App.jsx             # الحالة الرئيسية + التابات
        ├── api.js              # غلاف fetch لكل نداءات الـ API
        └── components/
            ├── TableAccordion.jsx
            ├── CustomerCard.jsx
            ├── QuickMenu.jsx
            └── AdminPanel.jsx
```

## 🔌 الـ API

| Method | Endpoint | الوظيفة |
|--------|----------|---------|
| GET | `/api/menu` | قائمة الأصناف (افتراضي + مخصص) |
| POST/PUT/DELETE | `/api/menu/:id?` | إضافة/تعديل/حذف صنف |
| GET | `/api/tables` | الطاولات النشطة مع الزبائن والطلبات والإجماليات |
| POST | `/api/tables` | إضافة طاولة |
| DELETE | `/api/tables/:id` | حذف طاولة + كل زبائنها وطلباتها (cascade) |
| POST | `/api/customers` | إضافة زبون لطاولة |
| PUT | `/api/customers/:id` | تعديل/إلغاء السعر اليدوي |
| PATCH | `/api/customers/:id/paid` | تحديد كمدفوع |
| DELETE | `/api/customers/:id` | حذف زبون + طلباته |
| POST | `/api/orders` | إضافة صنف لزبون |
| PUT | `/api/orders/:id` | زيادة/نقصان الكمية (`{delta}`) |
| DELETE | `/api/orders/:id` | حذف صنف |
| GET | `/api/admin/stats` | ملخص الوردية (إيراد مدفوع، طاولات نشطة...) |
| POST | `/api/admin/reset` | تصفية كل الطاولات لوردية جديدة |

## 🚀 التشغيل محلياً

### المتطلبات
- Node.js 18+
- MongoDB شغّال محلياً، أو رابط MongoDB Atlas

### 1) الباك إند
```bash
cd server
npm install
cp .env.example .env        # عدّل MONGO_URI لو لزم
npm run seed                # إدخال القائمة الافتراضية (مرة واحدة)
npm run dev                 # السيرفر على http://localhost:5000
```

### 2) الفرونت إند
```bash
cd client
npm install
npm run dev                 # الواجهة على http://localhost:5173
```

افتح `http://localhost:5173` — نداءات `/api` بتتحوّل تلقائياً للباك إند.

## 🧠 إدارة الحالة (State Management)
- **MongoDB هي مصدر الحقيقة الوحيد.**
- `GET /api/tables` بيرجّع الشجرة كاملة (طاولات ← زبائن ← طلبات) مع الإجماليات محسوبة في السيرفر، فالواجهة بس بتعرض.
- كل تعديل في الواجهة بينادي `api.*` وبعدها `reload()` يعيد جلب الشجرة، فالعرض دايماً متطابق مع الداتابيز.
