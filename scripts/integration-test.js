import { createClient } from '@supabase/supabase-js'

// Valores do index.html (usados pela versão estática do site)
const SUPABASE_URL = 'https://gaavvugqlsjdcejgxsuh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhYXZ2dWdxbHNqZGNlamd4c3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NTgwMzQsImV4cCI6MjA4ODAzNDAzNH0.Py8q5txusWcSy1dmt0Qvr-LkUOKeZrg8A9jrcjFNJPg'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const marker = `integ_test_${Date.now()}`

async function run() {
  console.log('Iniciando testes de integração com Supabase...')
  const results = { gifts: {}, guests: {}, messages: {} }

  // 1) Ler gifts
  try {
    const { data, error } = await supabase.from('gifts').select('*').order('created_at', { ascending: false })
    if (error) throw error
    results.gifts.read = { ok: true, count: data.length }
    console.log(`Gifts existentes: ${data.length}`)
  } catch (err) {
    results.gifts.read = { ok: false, error: err.message }
    console.error('Erro lendo gifts:', err.message)
  }

  // 2) Criar um presente de teste
  let testGift = null
  try {
    const payload = { name: `TEST GIFT ${marker}`, category: 'test' }
    const { data, error } = await supabase.from('gifts').insert([payload]).select().single()
    if (error) throw error
    testGift = data
    results.gifts.insert = { ok: true, id: testGift.id }
    console.log('Presente de teste criado:', testGift.id)
  } catch (err) {
    results.gifts.insert = { ok: false, error: err.message }
    console.error('Erro criando gift:', err.message)
  }

  // 3) Reservar (atualizar) o presente
  try {
    if (!testGift) throw new Error('no test gift')
    const { data, error } = await supabase.from('gifts').update({ status: 'reserved', reserved_by: 'IntegrationTester', reserved_at: new Date().toISOString() }).eq('id', testGift.id).select().single()
    if (error) throw error
    results.gifts.reserve = { ok: true }
    console.log('Presente reservado com sucesso')
  } catch (err) {
    results.gifts.reserve = { ok: false, error: err.message }
    console.error('Erro reservando gift:', err.message)
  }

  // 4) Reverter reserva
  try {
    if (!testGift) throw new Error('no test gift')
    const { data, error } = await supabase.from('gifts').update({ status: 'available', reserved_by: null, reserved_at: null }).eq('id', testGift.id).select().single()
    if (error) throw error
    results.gifts.unreserve = { ok: true }
    console.log('Reserva revertida')
  } catch (err) {
    results.gifts.unreserve = { ok: false, error: err.message }
    console.error('Erro revertendo reserva:', err.message)
  }

  // 5) Inserir mensagem de teste
  let testMessage = null
  try {
    const payload = { name: `Tester ${marker}`, message: `Mensagem de teste ${marker}` }
    const { data, error } = await supabase.from('messages').insert([payload]).select().single()
    if (error) throw error
    testMessage = data
    results.messages.insert = { ok: true, id: testMessage.id }
    console.log('Mensagem de teste criada:', testMessage.id)
  } catch (err) {
    results.messages.insert = { ok: false, error: err.message }
    console.error('Erro criando mensagem:', err.message)
  }

  // 6) Ler mensagens recentes e confirmar presença da test message
  try {
    const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(10)
    if (error) throw error
    results.messages.read = { ok: true, count: data.length }
    console.log(`Mensagens lidas: ${data.length}`)
  } catch (err) {
    results.messages.read = { ok: false, error: err.message }
    console.error('Erro lendo mensagens:', err.message)
  }

  // 7) Inserir convidado de teste
  let testGuest = null
  try {
    const payload = { name: `Guest ${marker}`, whatsapp: null, acompanhantes: 0, fralda_tamanho: null, observacao: 'Teste', status: 'sim' }
    const { data, error } = await supabase.from('guests').insert([payload]).select().single()
    if (error) throw error
    testGuest = data
    results.guests.insert = { ok: true, id: testGuest.id }
    console.log('Convidado de teste criado:', testGuest.id)
  } catch (err) {
    results.guests.insert = { ok: false, error: err.message }
    console.error('Erro criando convidado:', err.message)
  }

  // 8) Atualizar status do convidado
  try {
    if (!testGuest) throw new Error('no test guest')
    const { data, error } = await supabase.from('guests').update({ status: 'nao' }).eq('id', testGuest.id).select().single()
    if (error) throw error
    results.guests.update = { ok: true }
    console.log('Status do convidado atualizado para nao')
  } catch (err) {
    results.guests.update = { ok: false, error: err.message }
    console.error('Erro atualizando convidado:', err.message)
  }

  // 9) Marcar whatsapp_enviado true
  try {
    if (!testGuest) throw new Error('no test guest')
    const { data, error } = await supabase.from('guests').update({ whatsapp_enviado: true }).eq('id', testGuest.id).select().single()
    if (error) throw error
    results.guests.whatsapp = { ok: true }
    console.log('whatsapp_enviado marcado true')
  } catch (err) {
    results.guests.whatsapp = { ok: false, error: err.message }
    console.error('Erro marcando whatsapp_enviado:', err.message)
  }

  // 10) Ler convidados (admin flow)
  try {
    const { data, error } = await supabase.from('guests').select('*').order('created_at', { ascending: false }).limit(10)
    if (error) throw error
    results.guests.read = { ok: true, count: data.length }
    console.log(`Convidados lidos: ${data.length}`)
  } catch (err) {
    results.guests.read = { ok: false, error: err.message }
    console.error('Erro lendo convidados:', err.message)
  }

  // LIMPEZA: remover os registros de teste criados
  const cleanup = async () => {
    try {
      if (testGift) {
        await supabase.from('gifts').delete().eq('id', testGift.id)
        console.log('Presente de teste deletado')
      }
      if (testMessage) {
        await supabase.from('messages').delete().eq('id', testMessage.id)
        console.log('Mensagem de teste deletada')
      }
      if (testGuest) {
        await supabase.from('guests').delete().eq('id', testGuest.id)
        console.log('Convidado de teste deletado')
      }
    } catch (err) {
      console.error('Erro durante limpeza:', err.message)
    }
  }

  await cleanup()

  console.log('\nResultados resumidos:')
  console.log(JSON.stringify(results, null, 2))
  console.log('\nTeste de integração finalizado.')
}

run().catch(err => { console.error('Erro inesperado:', err); process.exit(1) })
