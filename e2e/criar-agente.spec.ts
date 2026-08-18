import { expect, test } from '@playwright/test'

test('cria um agente e envia os dados corretos para a API', async ({ page }) => {
  let corpoDaRequisicao: unknown

  await page.route('**/api/tipo-agente', (route) =>
    route.fulfill({ json: ['VENDITORE'] }),
  )
  await page.route('**/api/agenti', async (route) => {
    if (route.request().method() === 'POST') {
      corpoDaRequisicao = route.request().postDataJSON()
      await route.fulfill({ status: 201, json: { id: 1 } })
      return
    }

    await route.fulfill({ json: [] })
  })
  page.on('dialog', (dialog) => dialog.accept())

  await page.goto('/agentes/criar')
  await page.getByRole('textbox', { name: 'Nome' }).fill('Mario Rossi')
  await page.getByRole('textbox', { name: 'Email' }).fill('mario.rossi@example.com')
  await page.getByRole('combobox', { name: 'Tipo di agente' }).click()
  await page.getByRole('option', { name: 'VENDITORE' }).click()
  await page.getByRole('button', { name: 'Crea agente' }).click()

  await expect(page).toHaveURL(/\/agentes$/)
  expect(corpoDaRequisicao).toEqual({
    nome: 'Mario Rossi',
    email: 'mario.rossi@example.com',
    tipoAgente: 'VENDITORE',
    archiviato: false,
  })
})
