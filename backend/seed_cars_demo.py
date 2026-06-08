"""
Seed 3 demo curated cars directly into MongoDB. Idempotent — checks for
existing slugs before inserting.

Run with:
    cd /app/backend && python seed_cars_demo.py
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


def budget_for(p):
    if p < 10000: return "under_10k"
    if p < 15000: return "10_15k"
    if p < 25000: return "15_25k"
    if p < 40000: return "25_40k"
    if p < 60000: return "40_60k"
    return "60k_plus"


DEMOS = [
    {
        "make": "Audi",
        "model": "A6",
        "year": 2021,
        "title_ru": "Audi A6 Quattro 2021",
        "title_en": "Audi A6 Quattro 2021",
        "body_type": "sedan",
        "color_name": "Серый",
        "seats": 5,
        "doors": 4,
        "engine_type": "diesel",
        "engine_volume_l": 3.0,
        "power_hp": 286,
        "transmission": "automatic",
        "drive": "awd",
        "mileage_km": 42000,
        "condition": "excellent",
        "damage": "none",
        "accident_history": False,
        "service_history": "Полная история обслуживания у официального дилера",
        "price_eur": 38500,
        "price_is_approximate": True,
        "admin_badge": "top_pick",
        "admin_note_ru": "Один из самых сбалансированных бизнес-седанов в этом бюджете. Диагностика проведена, рекомендуем к покупке.",
        "admin_note_en": "One of the most balanced executive sedans in this budget. Inspected and ready to ship.",
        "recommended": True,
        "options": ["Панорамная крыша", "Адаптивный круиз", "Кожаный салон", "Подогрев сидений", "Memory pack"],
        "main_image_url": "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=80",
        "gallery": [
            "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80",
        ],
        "published": True,
        "sort_order": 1,
    },
    {
        "make": "BMW",
        "model": "X5",
        "year": 2020,
        "title_ru": "BMW X5 xDrive40i 2020",
        "title_en": "BMW X5 xDrive40i 2020",
        "body_type": "suv",
        "color_name": "Чёрный",
        "seats": 5,
        "doors": 5,
        "engine_type": "petrol",
        "engine_volume_l": 3.0,
        "power_hp": 340,
        "transmission": "automatic",
        "drive": "awd",
        "mileage_km": 58000,
        "condition": "very_good",
        "damage": "none",
        "accident_history": False,
        "service_history": "Регулярное ТО, последний сервис при 55000 км",
        "price_eur": 54500,
        "price_is_approximate": True,
        "admin_badge": "recommended",
        "admin_note_ru": "Полноразмерный кроссовер с премиум-комплектацией. Идеально для семьи и командировок.",
        "admin_note_en": "Full-size premium SUV — perfect for family trips and long-distance comfort.",
        "recommended": True,
        "options": ["Подвеска xDrive", "M Sport Package", "Harman/Kardon", "Поясничная поддержка", "Парктроник 360°"],
        "main_image_url": "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=80",
        "gallery": [
            "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1617886322168-72b886573c5f?auto=format&fit=crop&w=1400&q=80",
        ],
        "published": True,
        "sort_order": 2,
    },
    {
        "make": "Tesla",
        "model": "Model 3",
        "year": 2022,
        "title_ru": "Tesla Model 3 Long Range 2022",
        "title_en": "Tesla Model 3 Long Range 2022",
        "body_type": "sedan",
        "color_name": "Белый",
        "seats": 5,
        "doors": 4,
        "engine_type": "electric",
        "engine_volume_l": None,
        "power_hp": 351,
        "transmission": "automatic",
        "drive": "awd",
        "mileage_km": 21000,
        "condition": "excellent",
        "damage": "none",
        "accident_history": False,
        "service_history": "Один владелец, гарантия Tesla",
        "price_eur": 31900,
        "price_is_approximate": True,
        "admin_badge": "best_price",
        "admin_note_ru": "Электромобиль с запасом хода 580 км. Заряд через Supercharger 15 минут до 80%.",
        "admin_note_en": "Long-range EV with 580 km range. Supercharger 15-min top-up to 80%.",
        "recommended": True,
        "options": ["Autopilot", "Premium интерьер", "Panoramic roof", "Vegan leather", "Heat pump"],
        "main_image_url": "https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?auto=format&fit=crop&w=1400&q=80",
        "gallery": [
            "https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1617704548623-340376564e1f?auto=format&fit=crop&w=1400&q=80",
        ],
        "published": True,
        "sort_order": 3,
    },
    {
        "make": "Volkswagen",
        "model": "Golf",
        "year": 2019,
        "title_ru": "Volkswagen Golf 1.5 TSI 2019",
        "title_en": "Volkswagen Golf 1.5 TSI 2019",
        "body_type": "hatchback",
        "color_name": "Синий",
        "seats": 5,
        "doors": 5,
        "engine_type": "petrol",
        "engine_volume_l": 1.5,
        "power_hp": 150,
        "transmission": "dct",
        "drive": "fwd",
        "mileage_km": 78000,
        "condition": "good",
        "damage": "light",
        "accident_history": False,
        "service_history": "Сервисная книжка, ТО каждые 15000 км",
        "price_eur": 13900,
        "price_is_approximate": True,
        "admin_badge": "low_mileage",
        "admin_note_ru": "Хороший вариант для города с экономным расходом. Лёгкие косметические замечания учтены в цене.",
        "admin_note_en": "Great city commuter with low fuel consumption. Minor cosmetic touches included in price.",
        "recommended": True,
        "options": ["Climatronic", "LED Adaptive", "Apple CarPlay", "Парктроник"],
        "main_image_url": "https://images.unsplash.com/photo-1632245889029-e406faaa34cd?auto=format&fit=crop&w=1400&q=80",
        "gallery": [
            "https://images.unsplash.com/photo-1632245889029-e406faaa34cd?auto=format&fit=crop&w=1400&q=80",
        ],
        "published": True,
        "sort_order": 4,
    },
    # ───────── Additional 9 cars (total 13) — seeded once, admin manages from CMS ─────────
    {
        "make": "Mercedes-Benz", "model": "E 220d", "year": 2020,
        "title_ru": "Mercedes-Benz E 220d AMG Line 2020", "title_en": "Mercedes-Benz E 220d AMG Line 2020",
        "body_type": "sedan", "color_name": "Чёрный", "seats": 5, "doors": 4,
        "engine_type": "diesel", "engine_volume_l": 2.0, "power_hp": 194,
        "transmission": "automatic", "drive": "rwd", "mileage_km": 64000,
        "condition": "very_good", "damage": "none", "accident_history": False,
        "service_history": "ТО у официального дилера, последний при 60 000 км",
        "price_eur": 32900, "price_is_approximate": True, "admin_badge": "top_pick",
        "admin_note_ru": "Бизнес-класс с AMG-пакетом, идеален для дальних поездок.",
        "admin_note_en": "Executive sedan with AMG line — perfect long-haul cruiser.",
        "recommended": True,
        "options": ["AMG Line", "LED Multibeam", "Burmester", "Memory pack", "Дистроник"],
        "main_image_url": "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=1400&q=80",
        "gallery": ["https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&w=1400&q=80"],
        "published": True, "sort_order": 5,
    },
    {
        "make": "Toyota", "model": "RAV4", "year": 2021,
        "title_ru": "Toyota RAV4 Hybrid AWD 2021", "title_en": "Toyota RAV4 Hybrid AWD 2021",
        "body_type": "suv", "color_name": "Серебристый", "seats": 5, "doors": 5,
        "engine_type": "hybrid", "engine_volume_l": 2.5, "power_hp": 222,
        "transmission": "automatic", "drive": "awd", "mileage_km": 38000,
        "condition": "excellent", "damage": "none", "accident_history": False,
        "service_history": "Официальный дилер, гарантия до 2026",
        "price_eur": 28500, "price_is_approximate": True, "admin_badge": "low_mileage",
        "admin_note_ru": "Гибридный кроссовер с низким расходом — отличный выбор для семьи.",
        "admin_note_en": "Hybrid crossover with low fuel consumption — great family pick.",
        "recommended": True,
        "options": ["Toyota Safety Sense", "Panoramic roof", "JBL sound", "Apple CarPlay", "Heated seats"],
        "main_image_url": "https://images.unsplash.com/photo-1606220838315-056192d5e927?auto=format&fit=crop&w=1400&q=80",
        "gallery": ["https://images.unsplash.com/photo-1606220838315-056192d5e927?auto=format&fit=crop&w=1400&q=80"],
        "published": True, "sort_order": 6,
    },
    {
        "make": "Porsche", "model": "Cayenne", "year": 2019,
        "title_ru": "Porsche Cayenne S 2019", "title_en": "Porsche Cayenne S 2019",
        "body_type": "suv", "color_name": "Синий", "seats": 5, "doors": 5,
        "engine_type": "petrol", "engine_volume_l": 2.9, "power_hp": 440,
        "transmission": "automatic", "drive": "awd", "mileage_km": 71000,
        "condition": "very_good", "damage": "none", "accident_history": False,
        "service_history": "Полная история обслуживания у Porsche Center",
        "price_eur": 58900, "price_is_approximate": True, "admin_badge": "recommended",
        "admin_note_ru": "Премиум-кроссовер с двигателем 2.9 V6 BiTurbo — спортивный характер.",
        "admin_note_en": "Premium SUV with 2.9 V6 BiTurbo — true sports character.",
        "recommended": True,
        "options": ["Sport Chrono", "PASM", "BOSE", "Panoramic roof", "Ventilated seats"],
        "main_image_url": "https://images.unsplash.com/photo-1612544448445-b8232cff3b6c?auto=format&fit=crop&w=1400&q=80",
        "gallery": ["https://images.unsplash.com/photo-1612544448445-b8232cff3b6c?auto=format&fit=crop&w=1400&q=80"],
        "published": True, "sort_order": 7,
    },
    {
        "make": "Skoda", "model": "Octavia", "year": 2020,
        "title_ru": "Skoda Octavia Style 1.5 TSI 2020", "title_en": "Skoda Octavia Style 1.5 TSI 2020",
        "body_type": "wagon", "color_name": "Серый", "seats": 5, "doors": 5,
        "engine_type": "petrol", "engine_volume_l": 1.5, "power_hp": 150,
        "transmission": "dct", "drive": "fwd", "mileage_km": 52000,
        "condition": "very_good", "damage": "none", "accident_history": False,
        "service_history": "Сервисная книжка, регулярное ТО",
        "price_eur": 17900, "price_is_approximate": True, "admin_badge": "best_price",
        "admin_note_ru": "Универсал с огромным багажником и экономным расходом — рабочая лошадка.",
        "admin_note_en": "Wagon with massive boot and fuel-efficient engine — workhorse pick.",
        "recommended": False,
        "options": ["Virtual Cockpit", "Adaptive cruise", "Apple CarPlay", "Climatronic"],
        "main_image_url": "https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1400&q=80",
        "gallery": ["https://images.unsplash.com/photo-1581540222194-0def2dda95b8?auto=format&fit=crop&w=1400&q=80"],
        "published": True, "sort_order": 8,
    },
    {
        "make": "Hyundai", "model": "Tucson", "year": 2022,
        "title_ru": "Hyundai Tucson 1.6 T-GDI Hybrid 2022", "title_en": "Hyundai Tucson 1.6 T-GDI Hybrid 2022",
        "body_type": "suv", "color_name": "Белый", "seats": 5, "doors": 5,
        "engine_type": "hybrid", "engine_volume_l": 1.6, "power_hp": 230,
        "transmission": "automatic", "drive": "awd", "mileage_km": 24000,
        "condition": "excellent", "damage": "none", "accident_history": False,
        "service_history": "Официальный дилер, гарантия до 2027",
        "price_eur": 26900, "price_is_approximate": True, "admin_badge": "low_mileage",
        "admin_note_ru": "Свежий гибрид, малый пробег, гарантия завода ещё действует.",
        "admin_note_en": "Fresh hybrid with low mileage — factory warranty still active.",
        "recommended": True,
        "options": ["Krell sound", "Heated wheel", "Wireless CarPlay", "ADAS L2", "Ambient lighting"],
        "main_image_url": "https://images.unsplash.com/photo-1669215434574-a4f6f9f87b91?auto=format&fit=crop&w=1400&q=80",
        "gallery": ["https://images.unsplash.com/photo-1669215434574-a4f6f9f87b91?auto=format&fit=crop&w=1400&q=80"],
        "published": True, "sort_order": 9,
    },
    {
        "make": "Kia", "model": "Sportage", "year": 2021,
        "title_ru": "Kia Sportage GT-Line 2021", "title_en": "Kia Sportage GT-Line 2021",
        "body_type": "suv", "color_name": "Красный", "seats": 5, "doors": 5,
        "engine_type": "diesel", "engine_volume_l": 2.0, "power_hp": 185,
        "transmission": "automatic", "drive": "awd", "mileage_km": 45000,
        "condition": "very_good", "damage": "none", "accident_history": False,
        "service_history": "Регулярное ТО у официального дилера",
        "price_eur": 22500, "price_is_approximate": True, "admin_badge": "recommended",
        "admin_note_ru": "GT-Line с агрессивным дизайном, кожаный салон, проекционный дисплей.",
        "admin_note_en": "GT-Line trim with aggressive styling, leather and HUD.",
        "recommended": False,
        "options": ["HUD", "JBL", "Heated/Cooled seats", "Wireless charger", "Pano roof"],
        "main_image_url": "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1400&q=80",
        "gallery": ["https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1400&q=80"],
        "published": True, "sort_order": 10,
    },
    {
        "make": "Volvo", "model": "XC60", "year": 2020,
        "title_ru": "Volvo XC60 B4 Momentum Pro 2020", "title_en": "Volvo XC60 B4 Momentum Pro 2020",
        "body_type": "suv", "color_name": "Тёмно-синий", "seats": 5, "doors": 5,
        "engine_type": "mild_hybrid", "engine_volume_l": 2.0, "power_hp": 197,
        "transmission": "automatic", "drive": "awd", "mileage_km": 67000,
        "condition": "very_good", "damage": "none", "accident_history": False,
        "service_history": "Сервисная книга Volvo, последний сервис при 65 000 км",
        "price_eur": 29900, "price_is_approximate": True, "admin_badge": "top_pick",
        "admin_note_ru": "Скандинавский премиум с лучшей в классе безопасностью.",
        "admin_note_en": "Scandinavian premium with class-leading safety.",
        "recommended": True,
        "options": ["Pilot Assist", "Harman/Kardon", "Air suspension", "Heated steering", "360° camera"],
        "main_image_url": "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1400&q=80",
        "gallery": ["https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1400&q=80"],
        "published": True, "sort_order": 11,
    },
    {
        "make": "Ford", "model": "Kuga", "year": 2019,
        "title_ru": "Ford Kuga ST-Line 2.0 TDCi 2019", "title_en": "Ford Kuga ST-Line 2.0 TDCi 2019",
        "body_type": "suv", "color_name": "Чёрный", "seats": 5, "doors": 5,
        "engine_type": "diesel", "engine_volume_l": 2.0, "power_hp": 180,
        "transmission": "automatic", "drive": "awd", "mileage_km": 84000,
        "condition": "good", "damage": "light", "accident_history": False,
        "service_history": "Большая часть ТО по дилерским требованиям",
        "price_eur": 14900, "price_is_approximate": True, "admin_badge": "best_price",
        "admin_note_ru": "Кроссовер начального уровня с честным пробегом и адекватной ценой.",
        "admin_note_en": "Entry-level SUV with honest mileage and fair pricing.",
        "recommended": False,
        "options": ["Sync 3", "Park assist", "Heated front seats", "Adaptive cruise"],
        "main_image_url": "https://images.unsplash.com/photo-1612825173281-9a193378527e?auto=format&fit=crop&w=1400&q=80",
        "gallery": ["https://images.unsplash.com/photo-1612825173281-9a193378527e?auto=format&fit=crop&w=1400&q=80"],
        "published": True, "sort_order": 12,
    },
    {
        "make": "Renault", "model": "Megane", "year": 2018,
        "title_ru": "Renault Megane Bose Edition 2018", "title_en": "Renault Megane Bose Edition 2018",
        "body_type": "hatchback", "color_name": "Серый", "seats": 5, "doors": 5,
        "engine_type": "petrol", "engine_volume_l": 1.3, "power_hp": 140,
        "transmission": "manual", "drive": "fwd", "mileage_km": 92000,
        "condition": "good", "damage": "none", "accident_history": False,
        "service_history": "Книга сервиса, всё штатно",
        "price_eur": 9800, "price_is_approximate": True, "admin_badge": "best_price",
        "admin_note_ru": "Доступный городской хетчбэк с премиум-аудио Bose.",
        "admin_note_en": "Affordable city hatch with premium Bose audio.",
        "recommended": False,
        "options": ["Bose audio", "R-Link", "LED lights", "Climate control"],
        "main_image_url": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1400&q=80",
        "gallery": ["https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1400&q=80"],
        "published": True, "sort_order": 13,
    },
]


def slugify(make, model, year):
    base = f"{make}-{model}-{year}".lower().replace(" ", "-")
    suffix = uuid.uuid4().hex[:6]
    return f"{base}-{suffix}"


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    now = datetime.now(timezone.utc)
    inserted = 0
    for d in DEMOS:
        # idempotent: skip if a published car with same make+model+year already exists
        existing = await db.cars.find_one({
            "make": d["make"], "model": d["model"], "year": d["year"], "published": True,
        })
        if existing:
            print(f"  skip existing: {d['make']} {d['model']} {d['year']}")
            continue
        doc = dict(d)
        doc["id"] = str(uuid.uuid4())
        doc["slug"] = slugify(d["make"], d["model"], d["year"])
        doc["currency"] = "EUR"
        doc["budget_bucket"] = budget_for(d["price_eur"])
        doc["created_at"] = now
        doc["updated_at"] = now
        await db.cars.insert_one(doc)
        inserted += 1
        print(f"  inserted: {doc['slug']} ({d['make']} {d['model']} {d['year']}, {d['price_eur']} €)")
    print(f"\nDONE: {inserted} cars inserted")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
