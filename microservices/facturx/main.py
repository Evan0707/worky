from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import tempfile
import os
import base64
from playwright.sync_api import sync_playwright
from facturx import generate_from_file
from jinja2 import Template
import datetime

app = FastAPI()

class GenerateRequest(BaseModel):
    html: str
    invoice_data: Dict[str, Any]
    profile: Optional[str] = "MINIMUM"
    country: Optional[str] = "FR"

# Minimal dynamic XML template for Factur-X MINIMUM
XML_TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:minimum</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>{{ invoice.number }}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">{{ invoice.date_str }}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>{{ seller.name }}</ram:Name>
        <ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">{{ seller.siret }}</ram:ID>
        </ram:SpecifiedLegalOrganization>
        <ram:PostalTradeAddress>
          <ram:CountryID>{{ seller.country }}</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">{{ seller.vat }}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>{{ buyer.name }}</ram:Name>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>{{ invoice.currency }}</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:TaxBasisTotalAmount>{{ invoice.total_ht }}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="{{ invoice.currency }}">{{ invoice.total_vat }}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>{{ invoice.total_ttc }}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>{{ invoice.total_ttc }}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
"""

@app.post("/generate")
def generate_facturx(request: GenerateRequest):
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            # 1. Generate PDF
            pdf_path = os.path.join(temp_dir, "invoice.pdf")
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.set_content(request.html)
                # Wait for network idle to ensure fonts are loaded
                page.wait_for_load_state("networkidle")
                page.pdf(path=pdf_path, format="A4", print_background=True)
                browser.close()

            # 2. Generate XML
            xml_path = os.path.join(temp_dir, "factur-x.xml")
            template = Template(XML_TEMPLATE)
            # Assuming invoice_data has specific shape, we format for MINIMUM profile
            xml_content = template.render(
                invoice={
                    "number": request.invoice_data.get("number", "INV-001"),
                    "date_str": datetime.datetime.now().strftime("%Y%m%d"),
                    "currency": request.invoice_data.get("currency", "EUR"),
                    "total_ht": "{:.2f}".format(request.invoice_data.get("totalHT", 0) / 100),
                    "total_vat": "{:.2f}".format(request.invoice_data.get("totalTVA", 0) / 100),
                    "total_ttc": "{:.2f}".format(request.invoice_data.get("totalTTC", 0) / 100),
                },
                seller={
                    "name": request.invoice_data.get("artisan", {}).get("companyName") or "My Company",
                    "siret": request.invoice_data.get("artisan", {}).get("siret") or "00000000000000",
                    "country": request.country or "FR",
                    "vat": request.invoice_data.get("artisan", {}).get("vatNumber") or "FR00000000000",
                },
                buyer={
                    "name": request.invoice_data.get("client", {}).get("name") or "Client Name",
                }
            )
            with open(xml_path, "w", encoding="utf-8") as f:
                f.write(xml_content)

            # 3. Merge Factur-X
            out_pdf_path = os.path.join(temp_dir, "invoice_facturx.pdf")
            # factur-x merges xml into pdf (creates a PDF/A-3)
            # by default it checks XML format (MINIMUM)
            generate_from_file(pdf_path, xml_path, output_pdf_file=out_pdf_path)

            # 4. Return as Base64
            with open(out_pdf_path, "rb") as f:
                pdf_bytes = f.read()

            base64_pdf = base64.b64encode(pdf_bytes).decode("utf-8")
            return {"pdfBase64": base64_pdf}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
