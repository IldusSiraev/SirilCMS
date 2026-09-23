import { getPayload } from 'payload'
import config from '../../payload.config'

async function seed() {
  const payload = await getPayload({ config })
  try {
    const { totalDocs } = await payload.count({ collection: 'sites', overrideAccess: true })
    if (totalDocs > 0) {
      console.log('seed: skip (site exists)')
      return
    }
    console.log('seed: creating…')

    const site = await payload.create({
      collection: 'sites',
      overrideAccess: true,
      data: {
        name: 'Demo',
        slug: 'default',
        domain: process.env.NUXT_PUBLIC_SITE_DOMAIN ?? 'localhost:3000',
        theme: 'default',
      },
    })

    const [home, about, contact, services] = [
      await payload.create({
        collection: 'pages',
        overrideAccess: true,
        data: { site: site.id, title: 'Главная', slug: 'home', sections: [] },
      }),
      await payload.create({
        collection: 'pages',
        overrideAccess: true,
        data: { site: site.id, title: 'О проекте', slug: 'about', sections: [] },
      }),
      await payload.create({
        collection: 'pages',
        overrideAccess: true,
        data: { site: site.id, title: 'Контакты', slug: 'contact', sections: [] },
      }),
      await payload.create({
        collection: 'pages',
        overrideAccess: true,
        data: { site: site.id, title: 'Услуги', slug: 'services', sections: [] },
      }),
    ]

    const cats = (['Новости', 'Продукты', 'Записи'] as const).map((n) => ({
      site: site.id,
      name: n,
      slug: n.toLowerCase(),
    }))
    await Promise.all(cats.map((c) => payload.create({ collection: 'categories', overrideAccess: true, data: c })))

    for (let i = 1; i <= 3; i++) {
      await payload.create({
        collection: 'posts',
        overrideAccess: true,
        data: {
          site: site.id,
          title: `Пост ${i}`,
          slug: `post-${i}`,
          body: [{ type: 'paragraph', children: [{ type: 'text', text: `Текст поста ${i}…` }] }],
          category: null,
        },
      })
    }

    await payload.create({
      collection: 'site-content',
      overrideAccess: true,
      data: {
        site: site.id,
        navigation: [
          { label: 'Главная', page: home.id },
          { label: 'Услуги', page: services.id },
          { label: 'О проекте', page: about.id },
          { label: 'Контакты', page: contact.id },
        ],
      },
    })

    const ownerLogin = process.env.SEED_ADMIN_LOGIN ?? 'owner@demo.ru'
    const ownerPass = process.env.SEED_ADMIN_PASS ?? 'admin123'
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { email: ownerLogin, password: ownerPass, role: 'owner', name: 'Owner' },
    })
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { email: 'editor@demo.ru', password: 'editor123', role: 'editor', site: site.id, name: 'Editor' },
    })

    console.log(`seed: done. ${ownerLogin} / ${ownerPass}, editor@demo.ru / editor123`)
  } finally {
    await payload.db?.destroy?.()
  }
}

await seed()
