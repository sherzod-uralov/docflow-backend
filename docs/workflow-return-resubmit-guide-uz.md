# Hujjatni Qaytarish va Qayta Yuborish Bo'yicha Qo'llanma

Ushbu qo'llanma hujjatni oldingi tasdiqlovchiga qaytarish va qaytarilgan hujjatni qayta yuborish jarayonlarini tushuntiradi.

## Hujjatni Oldingi Tasdiqlovchiga Qaytarish

Agar hujjatni tuzatish yoki qo'shimcha ko'rib chiqish uchun oldingi tasdiqlovchiga qaytarish kerak bo'lsa, quyidagi bosqichlarni bajaring:

### 1-bosqich: Hujjat va Bosqichni Aniqlash

Avval, qaytarmoqchi bo'lgan hujjatning workflow ID va step ID raqamlarini aniqlang. Bu ma'lumotni kutilayotgan tasdiqlar ro'yxatidan topishingiz mumkin.

### 2-bosqich: Oldingi Foydalanuvchilarni Olish

Hujjatni qaytarishdan oldin, hujjatni qaytarish mumkin bo'lgan oldingi foydalanuvchilar ro'yxatini ko'rish uchun:

```
GET /approval-workflows/{workflowId}/steps/{stepId}/previous-users
```

Misol:
```
GET /approval-workflows/12/steps/25/previous-users
```

Bu so'rov hujjatni qaytarish uchun tanlash mumkin bo'lgan oldingi foydalanuvchilar ro'yxatini qaytaradi.

### 3-bosqich: Hujjatni Qaytarish

Hujjatni oldingi tasdiqlovchiga qaytarish uchun, step statusini yangilash uchun PATCH so'rovini yuboring:

```
PATCH /approval-workflows/{workflowId}/steps/{stepId}
```

So'rov tanasi:
```json
{
  "status": "RETURNED",
  "comment": "Iltimos, quyidagi tuzatishlarni kiriting",
  "rejectionReason": "Hujjat to'liq emas va qo'shimcha ma'lumot kerak",
  "returnToStepId": 24
}
```

Parametrlar:
- `status`: "RETURNED" qiymatiga ega bo'lishi kerak
- `comment`: Ixtiyoriy izoh
- `rejectionReason`: Hujjatni nima uchun qaytarayotganingizni tushuntirish (majburiy)
- `returnToStepId`: Hujjat qaytarilayotgan bosqich ID raqami (majburiy)

Misol:
```
PATCH /approval-workflows/12/steps/25
```

## Qaytarilgan Hujjatni Qayta Yuborish

Agar hujjat sizga tuzatish uchun qaytarilgan bo'lsa, kerakli o'zgartirishlarni kiritgandan so'ng uni qayta yuborishingiz kerak:

### 1-bosqich: Qaytarilgan Hujjatlarni Ko'rish

Qaytarilgan hujjatlar boshqaruv panelingizning "Qaytarilgan" bo'limida ko'rinadi.

### 2-bosqich: Tuzatishlarni Kiritish

Qaytarilgan hujjatni oching, qaytarish sababini ko'rib chiqing va hujjatga kerakli tuzatishlarni kiriting.

### 3-bosqich: Hujjatni Qayta Yuborish

Hujjatni qayta yuborish uchun, step statusini yangilash uchun PATCH so'rovini yuboring:

```
PATCH /approval-workflows/{workflowId}/steps/{stepId}
```

So'rov tanasi:
```json
{
  "status": "RESUBMITTED",
  "comment": "Men so'ralgan o'zgarishlarni kiritdim",
  "resubmissionExplanation": "Yetishmayotgan ma'lumotlarni qo'shdim va formatni to'g'riladim",
  "nextStepId": 25
}
```

Parametrlar:
- `status`: "RESUBMITTED" qiymatiga ega bo'lishi kerak
- `comment`: Ixtiyoriy umumiy izoh
- `resubmissionExplanation`: Qanday tuzatishlar kiritilganligini tushuntirish (majburiy)
- `nextStepId`: Hujjat keyingi yuborilishi kerak bo'lgan bosqich ID raqami (majburiy)

Misol:
```
PATCH /approval-workflows/12/steps/24
```

## Qaytarish/Qayta Yuborishdan Keyin Workflow Holati

- Hujjat qaytarilganda, workflow holati "IN_PROGRESS" ga o'zgaradi
- Qaytarilgan bosqich holati "PENDING" ga qaytariladi
- Hujjat qayta yuborilganda, workflow holati "IN_PROGRESS" bo'lib qoladi
- Qayta yuborishda ko'rsatilgan keyingi bosqich holati "PENDING" ga o'rnatiladi

## Muhim Eslatmalar

1. Hujjatni faqat workflowdagi oldingi bosqichga qaytarishingiz mumkin
2. Qayta yuborishda, hujjatni faqat joriy bosqichingizdan yuqori tartibli bosqichga yuborishingiz mumkin
3. Barcha harakatlar (qaytarish, qayta yuborish) vaqt belgilari bilan workflow tarixida qayd etiladi
4. Hujjatlar qaytarilganda yoki qayta yuborilganda tegishli foydalanuvchilarga bildirishnomalar yuboriladi

## API Ma'lumotnomasi

To'liq API hujjatlari uchun `/api` manzilida joylashgan Swagger hujjatlariga murojaat qiling.