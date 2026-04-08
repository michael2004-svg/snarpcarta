-- Seed data for Snapcarta (Accessories first)

-- Create/accessories category (upsert by slug)
with accessories as (
  insert into public.categories (name, slug, icon)
  values ('Accessories', 'accessories', 'package')
  on conflict (slug) do update set name = excluded.name
  returning id
)
insert into public.products (
  title, description, price, "originalPrice", image, images, specs,
  "categoryId", rating, "reviewCount", "inStock", stock, badge
)
select * from (
  values
    (
      'MagSafe Power Bank 10,000mAh',
      'Slim magnetic battery pack with USB-C fast charging and LED indicator.',
      39.99, 59.99,
      'https://images.unsplash.com/photo-1518441988790-8b03f1f2a9e0?auto=format&fit=crop&w=800&q=80',
      array[
        'https://images.unsplash.com/photo-1518441988790-8b03f1f2a9e0?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80'
      ],
      '{"Capacity":"10000mAh","Input":"USB-C 20W","Weight":"190g"}'::jsonb,
      (select id from accessories),
      4.6, 1240, true, 64, 'hot'
    ),
    (
      'Braided USB-C Cable (2m)',
      'Tangle-free braided charging cable with 60W Power Delivery support.',
      12.99, 19.99,
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
      array['https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'],
      '{"Length":"2m","Power":"60W PD"}'::jsonb,
      (select id from accessories),
      4.4, 892, true, 210, 'new'
    ),
    (
      'Laptop Stand - Aluminum',
      'Ergonomic adjustable laptop stand with ventilated base.',
      29.99, 49.99,
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      array['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'],
      '{"Material":"Aluminum","Adjustable":"Yes"}'::jsonb,
      (select id from accessories),
      4.5, 540, true, 88, 'sale'
    ),
    (
      'Wireless Charging Pad',
      'Fast wireless charger with foreign object detection and soft-touch finish.',
      24.99, 39.99,
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
      array['https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80'],
      '{"Output":"15W","Compatibility":"Qi"}'::jsonb,
      (select id from accessories),
      4.2, 318, true, 132, null
    ),
    (
      'Noise-Isolating Ear Tips',
      'Memory foam ear tips for improved comfort and isolation.',
      9.99, 14.99,
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
      array['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'],
      '{"Sizes":"S/M/L","Material":"Memory foam"}'::jsonb,
      (select id from accessories),
      4.1, 210, true, 400, null
    )
) as products(
  title, description, price, "originalPrice", image, images, specs,
  "categoryId", rating, "reviewCount", "inStock", stock, badge
);
