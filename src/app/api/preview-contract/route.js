import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { AdoptionContractPDF } from '@/lib/adoptionContractPDF'
import fs from 'fs'
import path from 'path'

let _logoDataUrl = null
function getLogoDataUrl() {
  if (_logoDataUrl) return _logoDataUrl
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'logo.png'))
    _logoDataUrl = `data:image/png;base64,${buf.toString('base64')}`
  } catch { _logoDataUrl = null }
  return _logoDataUrl
}

export async function GET() {
  const pdfBuffer = await renderToBuffer(
    createElement(AdoptionContractPDF, {
      applicantName: 'Björn Veit',
      applicantEmail: 'bjorn@example.com',
      applicantPhone: '+49 123 456 7890',
      applicantAddress: 'Musterstraße 12, Stuttgart',
      catName: 'Gabby Love',
      applicationId: 'PL-PREVIEW',
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      catPhotoUrl: 'https://cdn.sanity.io/images/kbircpfo/production/ddd2cadfd364ea8f277760c3bca4c7c2f001fac7-3024x4032.jpg?w=400&h=400&fit=crop',
      logoDataUrl: getLogoDataUrl(),
      catAge: '6 months (Kitten)',
      catGender: 'female',
    })
  )

  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="contract-preview.pdf"',
    },
  })
}
