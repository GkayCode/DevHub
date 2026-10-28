# DevHub — Kurulum

DevHub; Next.js frontend, Express/TypeScript backend ve MongoDB ile çalışır. GitHub App üzerinden giriş yapabilir, erişebildiğin repoları listeleyebilir ve yazma iznin olan depolarda README.md dosyasını GitHub'a commit edebilirsin.

## Gereksinimler

- Node.js 20 veya üzeri
- MongoDB (yerel veya MongoDB Atlas)
- GitHub hesabı ve GitHub App kimlik bilgileri

## 1. GitHub App oluştur

1. https://github.com/settings/apps adresinden **New GitHub App** oluştur.
2. Homepage URL: `http://localhost:3000`
3. Callback URL / User authorization callback URL: `http://localhost:5000/api/auth/github/callback`
4. **User permissions** bölümünde hesap kimliğini okuyabilmek için `Email addresses` isteğe bağlıdır; uygulama temel profil için `/user` API'sini kullanır.
5. **Repository permissions** altında `Contents` için **Read and write** seç.
6. Uygulamayı oluşturduktan sonra Client ID'yi ve Client secrets bölümünden bir Client Secret üret.
7. Gerekli özel repolara erişim için GitHub App'i ilgili hesap/organizasyon ve repolara kur. Organizasyon politikaları ek onay gerektirebilir.

GitHub App yetkileri ve kurulumları için: https://docs.github.com/en/apps/creating-github-apps

## 2. Backend ortam değişkenleri

`backend/.env.example` dosyasını `backend/.env` olarak kopyala ve değerleri doldur:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/devhub
GITHUB_CLIENT_ID=GitHub_App_Client_ID
GITHUB_CLIENT_SECRET=GitHub_App_Client_Secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
COOKIE_SECURE=false
```

`GITHUB_CLIENT_SECRET` gizlidir. Kaynak kontrolüne ekleme, kimseyle paylaşma. `.env` dosyası `.gitignore` içindedir. `COOKIE_SECURE=false` yalnızca localhost geliştirme içindir; HTTPS ile canlıya çıkarken `true` yap ve frontend/backend adreslerini HTTPS olarak ayarla.

## 3. Backend'i başlat

```bash
cd backend
npm install
npm run build
npm test
npm run dev
```

Backend `http://localhost:5000` adresinde çalışır. MongoDB bağlantısı kurulabilmelidir.

## 4. Frontend'i başlat

Yeni bir terminal:

```bash
cd frontend
npm install
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini aç ve **Sign in with GitHub** seçeneğine bas.

`frontend/.env.example` içindeki `NEXT_PUBLIC_API_URL` varsayılan olarak `http://localhost:5000` kullanır. Farklı port/host varsa frontend ortam değişkenini `.env.local` dosyasına kopyalayıp düzenle.

## Kullanım

1. Üst kısımdan GitHub hesabınla giriş yap.
2. **My repositories** sayfasında erişebildiğin depoları gör.
3. Bir repo seçip README içeriğini düzenle.
4. Commit mesajını düzenleyip **Commit README** butonuna bas.
5. Değişiklik, deponun varsayılan branch'ine GitHub API üzerinden commit edilir.

## API uç noktaları

- `GET /api/auth/github` — GitHub girişini başlatır
- `GET /api/auth/github/callback` — OAuth callback
- `GET /api/auth/me` — geçerli kullanıcı oturumu
- `POST /api/auth/logout` — oturumu kapatır
- `GET /api/account/repos` — giriş yapan kullanıcının erişebildiği repolar
- `GET /api/account/repos/:owner/:repo/readme` — README içeriği
- `PUT /api/account/repos/:owner/:repo/readme` — README'yi commit et

## Güvenlik notları

- GitHub token'ları frontend'e gönderilmez; MongoDB'de backend oturum kayıtlarında tutulur.
- Oturum kimliği HttpOnly cookie ile taşınır; OAuth `state` doğrulaması yapılır.
- README kaydetme isteğinde GitHub'dan repo izinleri doğrulanır ve yalnızca yazma izni olan depolar güncellenebilir.
- OAuth callback, CORS origin'i ve cookie ayarları canlı ortamda gerçek HTTPS alan adlarına göre yapılandırılmalıdır.
- Bu proje başlangıç uygulamasıdır. Canlıya açmadan önce MongoDB erişim kısıtlaması, HTTPS, loglarda token/secret sızmaması, rate limiting ve güvenlik testlerini gözden geçir.

## Bilinen sınırlar

- Repository listesi şu anda ilk 100 sonucu getirir.
- README işlemleri `README.md` dosyasını ve deponun varsayılan branch'ini kullanır.
- GitHub App'in gerekli izinlerle kurulmadığı depolar listede görünse bile README yazma işlemi GitHub tarafından reddedilebilir.
- Mevcut README taslakları MongoDB'de saklanır ve GitHub README commit akışından ayrıdır.
