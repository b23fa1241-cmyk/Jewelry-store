insert into categories(name,slug) values ('Бөгж','ring'),('Зүүлт','necklace'),('Ээмэг','earrings'),('Бугуйвч','bracelet');
insert into tags(name,type) values
 ('wedding','occasion'),('birthday','occasion'),('daily','occasion'),('gift','occasion'),
 ('classic','style'),('minimal','style'),('luxury','style'),('trendy','style'),
 ('self','recipient'),('partner','recipient'),('mother','recipient'),('friend','recipient'),
 ('gold','material'),('silver','material'),('rosegold','material');

insert into products(category_id,name,description,price,material,stock,image_url)
select c.id,v.n,v.d,v.p,v.m,v.s,'https://picsum.photos/seed/'||v.k||'/600/600'
from (values
 ('ring','Classic алтан бөгж','Уламжлалт хэлбэртэй 585 алтан бөгж',1250000,'gold',10,'r1'),
 ('ring','Алмазан сүйн бөгж','Бриллиант шигтгээтэй',3200000,'gold',3,'r2'),
 ('ring','Minimal мөнгөн бөгж','Өдөр тутмын нимгэн бөгж',180000,'silver',25,'r3'),
 ('ring','Rose gold бөгж','Трэнд загварын бөгж',890000,'rosegold',8,'r4'),
 ('necklace','Сувдан зүүлт','Байгалийн сувдан зүүлт',650000,'silver',12,'n1'),
 ('necklace','Алтан гинж зүүлт','Тансаг алтан гинж',1450000,'gold',6,'n2'),
 ('necklace','Minimal тойрог зүүлт','Энгийн тойрог дүрстэй',220000,'silver',30,'n3'),
 ('necklace','Rose gold зүрхэн зүүлт','Зүрх хэлбэрийн тэмдэг',540000,'rosegold',14,'n4'),
 ('earrings','Сувдан ээмэг','Сувдан ээмэг',380000,'silver',15,'e1'),
 ('earrings','Алтан цагираг ээмэг','Том цагираг ээмэг',780000,'gold',9,'e2'),
 ('earrings','Минимал шонгор ээмэг','Өдөр тутмын жижиг ээмэг',120000,'silver',40,'e3'),
 ('bracelet','Rose gold бугуйвч','Нимгэн гинжтэй бугуйвч',460000,'rosegold',11,'b1'),
 ('bracelet','Алтан бугуйвч','Өргөн алтан бугуйвч',1650000,'gold',5,'b2'),
 ('bracelet','Мөнгөн нимгэн бугуйвч','Минимал бугуйвч',150000,'silver',35,'b3')
) as v(cat,n,d,p,m,s,k) join categories c on c.slug = v.cat;

insert into product_tags(product_id,tag_id)
select p.id,t.id from (values
 ('Classic алтан бөгж','wedding,classic,gold,partner'),
 ('Алмазан сүйн бөгж','wedding,luxury,gold,partner'),
 ('Minimal мөнгөн бөгж','daily,minimal,silver,self'),
 ('Rose gold бөгж','birthday,trendy,rosegold,friend'),
 ('Сувдан зүүлт','classic,gift,silver,mother'),
 ('Алтан гинж зүүлт','luxury,gold,wedding,partner'),
 ('Minimal тойрог зүүлт','daily,minimal,silver,self'),
 ('Rose gold зүрхэн зүүлт','birthday,trendy,rosegold,partner'),
 ('Сувдан ээмэг','classic,gift,silver,mother'),
 ('Алтан цагираг ээмэг','luxury,gold,wedding'),
 ('Минимал шонгор ээмэг','daily,minimal,silver,friend,self'),
 ('Rose gold бугуйвч','trendy,rosegold,birthday,friend'),
 ('Алтан бугуйвч','luxury,gold,wedding,mother'),
 ('Мөнгөн нимгэн бугуйвч','daily,minimal,silver,self')
) v(n,tg) join products p on p.name = v.n
join tags t on t.name = any(string_to_array(v.tg, ','));

insert into quiz_questions(question_text,sort_order) values
 ('Ямар тохиолдолд зориулж байна вэ?',1),('Хэнд зориулж байна вэ?',2),
 ('Ямар хэв маяг таалагддаг вэ?',3),('Ямар металл илүүд үздэг вэ?',4);
insert into quiz_options(question_id,label,tag_id)
select q.id,v.l,t.id from (values
 (1,'Хурим','wedding'),(1,'Төрсөн өдөр','birthday'),(1,'Өдөр тутам','daily'),(1,'Бэлэг','gift'),
 (2,'Өөртөө','self'),(2,'Хайртдаа','partner'),(2,'Ээждээ','mother'),(2,'Найздаа','friend'),
 (3,'Classic','classic'),(3,'Minimal','minimal'),(3,'Тансаг','luxury'),(3,'Trendy','trendy'),
 (4,'Алт','gold'),(4,'Мөнгө','silver'),(4,'Rose gold','rosegold')
) v(s,l,tg) join quiz_questions q on q.sort_order = v.s join tags t on t.name = v.tg;

-- Өөрийн имэйлийг админ болгох (бүртгүүлсний дараа ажиллуулна):
-- update profiles set role='admin' where id=(select id from auth.users where email='ТАНЫ@EMAIL.COM');
