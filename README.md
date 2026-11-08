Lumière Jewelry

1. Төслийн зорилго

Lumière Jewelry нь хэрэглэгчийн хэв маяг, сонирхол, төсөвт тохирсон үнэт эдлэлийн бүтээгдэхүүнийг тест ашиглан санал болгодог онлайн дэлгүүр юм. Хэрэглэгч санал болгосон бүтээгдэхүүнүүдээс сонгон өөрийн хослолыг үүсгэх, хадгалах болон сагсанд нэмэх боломжтой.

Ашигласан технологи: React, Vite, Tailwind CSS, React Router, Supabase.

2. Суулгах заавар

1. Төслийг татах

git clone https://github.com/b23fa1241-cmyk/Jewelry-store.git
cd Jewelry-store

2. Supabase тохируулах

Supabase дээр төсөл үүсгээд SQL Editor хэсэгт дараах файлуудыг дарааллаар ажиллуулна.

supabase/schema.sql

supabase/seed.sql

3. Орчны хувьсагч тохируулах

.env.example файлыг .env болгон хуулж, Supabase-ийн Project URL болон anon key-г тохируулна.

4. Төслийг ажиллуулах

npm install
npm run dev

Хөтөч дээр http://localhost:5173 хаягаар нээнэ.

5. Админ эрх тохируулах

Бүртгүүлсний дараа seed.sql файлын доод хэсэгт байгаа UPDATE query-д өөрийн имэйлийг тохируулж Supabase SQL Editor дээр ажиллуулна.