import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FileDown, FileText, Table, DownloadCloud, Loader2, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const Reports = () => {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('http://localhost:5001/api/transactions', config);
        setTransactions(data);
      } catch (e) {
        console.error('Error fetching transactions', e);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchTransactions();
  }, [user]);

  const getFilteredData = () => {
    if (filter === 'expense') return transactions.filter(t => t.type === 'expense');
    if (filter === 'income') return transactions.filter(t => t.type === 'income');
    return transactions;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const data = getFilteredData();
    if (data.length === 0) return alert("No data available to export.");
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Primary Indigo color
    doc.text("FinGuide", 14, 22);
    
    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85);
    doc.text("Financial Statement Report", 14, 32);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 40);
    doc.text(`Report Type: ${filter.toUpperCase()}`, 14, 46);

    // Summary Analytics
    const totalIncome = data.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = data.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const netTotal = totalIncome - totalExpense;

    doc.text(`Total Income: Rs. ${totalIncome.toLocaleString('en-IN')}`, 14, 54);
    doc.text(`Total Expense: Rs. ${totalExpense.toLocaleString('en-IN')}`, 80, 54);
    doc.text(`Net Total: Rs. ${netTotal.toLocaleString('en-IN')}`, 150, 54);

    const tableColumn = ["Date", "Description", "Category", "Type", "Amount (Rs.)"];
    const tableRows = [];

    data.forEach(t => {
      const transactionData = [
        format(new Date(t.date), 'MMM dd, yyyy'),
        t.title,
        t.category,
        t.type.toUpperCase(),
        t.amount.toString()
      ];
      tableRows.push(transactionData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 62,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 10, cellPadding: 4 }
    });

    doc.save(`FinGuide_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const generateCSV = () => {
    const data = getFilteredData();
    if (data.length === 0) return alert("No data available to export.");

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Description,Category,Type,Amount\n";

    data.forEach(t => {
      // Escape commas in title for CSV safety
      const safeTitle = t.title.replace(/,/g, '');
      const formattedDate = `"${format(new Date(t.date), 'MMM dd, yyyy')}"`;
      const row = `${formattedDate},${safeTitle},${t.category},${t.type},${t.amount}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FinGuide_Data_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold dark:text-white mb-2 flex items-center">
          <FileDown className="mr-3 h-8 w-8 text-indigo-500" />
          Professional Exports
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Generate pixel-perfect PDF statements or detailed CSV spreadsheets of your financial history.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8"
      >
        <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-indigo-500" />
            <h2 className="font-semibold text-slate-800 dark:text-white">Report Configuration</h2>
          </div>
          <div className="flex gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1 max-w-xs px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white transition-shadow"
            >
              <option value="all">All Transactions</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
            <div className="flex-1 flex items-center text-sm text-slate-500 dark:text-slate-400">
              {loading ? (
                <span className="flex items-center"><Loader2 className="animate-spin mr-2 h-4 w-4" /> Syncing data...</span>
              ) : (
                <span>Found {getFilteredData().length} transactions matching your criteria.</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* PDF Export Card */}
          <div className="border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group">
            <div className="h-16 w-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-2">PDF Statement</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 h-12">
              A clean, formatted, printable document perfect for accountants or physical records.
            </p>
            <button
              onClick={generatePDF}
              disabled={loading || getFilteredData().length === 0}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition shadow-lg shadow-indigo-500/30 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DownloadCloud className="mr-2 h-5 w-5" /> Download PDF
            </button>
          </div>

          {/* CSV Export Card */}
          <div className="border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors group">
            <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Table className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold dark:text-white mb-2">CSV Spreadsheet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 h-12">
              Raw tabular data compatible with Excel, Google Sheets, or custom data processing.
            </p>
            <button
              onClick={generateCSV}
              disabled={loading || getFilteredData().length === 0}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition shadow-lg shadow-emerald-500/30 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DownloadCloud className="mr-2 h-5 w-5" /> Download CSV
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Reports;
