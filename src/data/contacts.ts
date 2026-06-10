// ЕДИНОЕ МЕСТО РЕДАКТИРОВАНИЯ КОНТАКТОВ.
// Поменяйте значения здесь — они обновятся на всём сайте.

export const contacts = {
  // Телефон: как отображается на сайте
  phoneDisplay: '+7 (___) ___-__-__',
  // Телефон: для ссылки tel: (только цифры, с +7)
  phoneHref: 'tel:+7',
  // Ссылка на WhatsApp, например: https://wa.me/79990000000
  whatsapp: 'https://wa.me/',
  // Ссылка на Telegram, например: https://t.me/username
  telegram: 'https://t.me/',
  // Email
  email: 'info@example.ru',
} as const

export const company = {
  name: 'ООО «Фаворит»',
  inn: '5507103806',
  sinceYear: 2015,
} as const
