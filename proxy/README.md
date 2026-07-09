# صحّتي — MiniMax Proxy

سيرفر وسيط صغير (Node.js/Express) بيشتغل على الـ VPS. تطبيق صحّتي بيكلم السيرفر ده **بس**،
والسيرفر هو الوحيد اللي معاه مفتاح MiniMax الحقيقي — المفتاح عمره ما يدخل كود التطبيق أو الموبايل.

**Stateless بالكامل:** مفيش أي حاجة بتتكتب على الديسك، ومفيش تسجيل لمحتوى الطلبات
(الصور الطبية والروشتات بتعدّي في الذاكرة وبس) — اللوج بيسجل المسار والحالة والزمن فقط.

## الـ Endpoints

| Method | Path | الوظيفة |
|---|---|---|
| GET | `/health` | فحص إن السيرفر شغال (من غير توكن) |
| POST | `/api/ai/chat` | شات: رسالة + تاريخ + بطاقة سياق → `{actions[], chat_reply}` |
| POST | `/api/ai/vision/meal` | صورة وجبة → أصناف + سعرات + ماكروز |
| POST | `/api/ai/vision/gym` | صورة جهاز جيم → التعرف + تمرين مقترح |
| POST | `/api/ai/vision/medical` | صورة روشتة/تحليل → بيانات مستخرجة |
| POST | `/api/ai/report` | بطاقة سياق → التقرير الأسبوعي + `weekly_memory` |

كل طلبات `/api/*` لازم معاها هيدر: `Authorization: Bearer <APP_TOKEN>`

الصور بتتبعت `image_base64` (+ `mime_type` اختياري) جوه الـ JSON body — الحد الأقصى 20MB.

## التشغيل على VPS Hostinger (خطوة بخطوة)

```bash
# 1) لو Node مش متسطب (محتاج 18+):
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2) ارفع مجلد proxy/ للسيرفر (مثلًا /opt/sehaty-proxy) وبعدين:
cd /opt/sehaty-proxy
npm install --omit=dev

# 3) الإعدادات:
cp .env.example .env
nano .env        # حط MINIMAX_API_KEY و APP_TOKEN (openssl rand -hex 32)

# 4) جرّب يدوي الأول:
npm start        # المفروض تشوف: sehaty-proxy listening on :8787
curl http://localhost:8787/health

# 5) خلّيه يشتغل دايمًا بـ pm2:
sudo npm install -g pm2
pm2 start server.js --name sehaty-proxy
pm2 save && pm2 startup   # ينفّذ السطر اللي pm2 هيطبعه — يشتغل تلقائي بعد الريستارت
```

### HTTPS (إجباري)

وجّه ساب-دومين (مثلًا `ai.yourdomain.com`) على IP الـ VPS، وبعدين nginx + Let's Encrypt:

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx

# /etc/nginx/sites-available/sehaty-proxy
server {
    server_name ai.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_set_header Host $host;
        client_max_body_size 25m;   # أكبر من ليمِت الصور بهامش
    }
}

sudo ln -s /etc/nginx/sites-available/sehaty-proxy /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ai.yourdomain.com   # شهادة SSL تلقائية + تجديد تلقائي
```

## توصيل التطبيق

في مشروع `sehaty/` اعمل ملف `.env` (أو حط القيم في بيئة EAS):

```
EXPO_PUBLIC_AI_BASE_URL=https://ai.yourdomain.com
EXPO_PUBLIC_AI_TOKEN=<نفس APP_TOKEN>
```

من غير القيمتين دول التطبيق بيشتغل بالـ Mocks المحلية بتاعته عادي.

## اختبار من غير مفتاح MiniMax

حط `MOCK_AI=1` في `.env` — كل الـ endpoints هترجع ردود ثابتة معقولة،
فتقدر تختبر التطبيق ↔ الـ Proxy end-to-end قبل ما المفتاح الحقيقي يتحط.

```bash
curl -X POST http://localhost:8787/api/ai/chat \
  -H "Authorization: Bearer $APP_TOKEN" -H "content-type: application/json" \
  -d '{"message":"أكلت نص فرخة مع رز"}'
```

## ملاحظات أمان

- `.env` مش بيتعمله commit (موجود في `.gitignore`).
- `APP_TOKEN` سر مشترك بين موبايلك والسيرفر — لو اتسرب، غيّره في الاتنين.
- مفيش CORS مفتوح — التطبيق Native فمش محتاجه أصلًا.
