const tesseract = require('tesseract.js');

exports.scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    console.log('Starting local OCR process...');
    
    // Process image buffer entirely locally (no API keys)
    const { data: { text } } = await tesseract.recognize(
      req.file.buffer,
      'eng'
    );

    // Smarter regex to guess Total Amount for Utility/Current Bills
    // Matches "Net Payable", "Amount Due", "Charges", etc.
    const amountRegex = /(?:total|amount|sum|due|payable|net|charges)(?:[\s\w]*?)(?:\s*:|-|=)?\s*[\$£€₹]?\s*(?:Rs\.?)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i;
    const amountMatch = text.match(amountRegex);
    let amount = 0;

    if (amountMatch) {
      amount = parseFloat(amountMatch[1]);
    } else {
      // SMART FALLBACK: If keywords fail on a messy 'current bill', 
      // extract all valid money-like numbers and pick the largest reasonable one.
      const numberMatches = text.match(/\b\d+(?:\.\d{1,2})?\b/g);
      if (numberMatches) {
        const numbers = numberMatches
          .map(n => parseFloat(n))
          .filter(n => n > 0 && n < 100000); // filter out obvious zero values & account numbers
        if (numbers.length > 0) {
          amount = Math.max(...numbers); // The total payable is typically the highest standalone value
        }
      }
    }

    // Enhance date regex to support formats like 12-Oct-2023 commonly found on current bills
    const dateRegex = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/i;
    const dateMatch = text.match(dateRegex);
    const date = dateMatch ? dateMatch[0] : new Date().toISOString();

    res.json({
      success: true,
      extractedDetails: {
        title: 'Receipt Scan',
        amount: amount || 0,
        date,
        type: 'expense',
        rawText: text // Useful for the frontend to show the user or train models
      }
    });
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ message: 'Error scanning receipt locally' });
  }
};
