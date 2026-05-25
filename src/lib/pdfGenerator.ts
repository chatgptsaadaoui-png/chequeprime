import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Check } from '../types';

interface GenerateReportParams {
  checks: Check[];
  type: 'client' | 'supplier';
  month: string; // '01' - '12' or 'all'
  year: string; // '2024' - '2027' or 'all'
  language: 'fr' | 'ar';
}

const MONTH_NAMES_FR: Record<string, string> = {
  '01': 'Janvier',
  '02': 'Février',
  '03': 'Mars',
  '04': 'Avril',
  '05': 'Mai',
  '06': 'Juin',
  '07': 'Juillet',
  '08': 'Août',
  '09': 'Septembre',
  '10': 'Octobre',
  '11': 'Novembre',
  '12': 'Décembre',
  'all': 'Toute l\'année'
};

const MONTH_NAMES_AR: Record<string, string> = {
  '01': 'يناير',
  '02': 'فبراير',
  '03': 'مارس',
  '04': 'أبريل',
  '05': 'ماي',
  '06': 'يونيو',
  '07': 'يوليوز',
  '08': 'غشت',
  '09': 'شتمبر',
  '10': 'أكتوبر',
  '11': 'نونبر',
  '12': 'دجنبر',
  'all': 'سنة كاملة'
};

export const generateChecksPDF = ({
  checks,
  type,
  month,
  year,
  language
}: GenerateReportParams) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Filter checks by month and year
  const filteredChecks = checks.filter(c => {
    if (!c.dueDate) return false;
    const dateParts = c.dueDate.split('-'); // YYYY-MM-DD
    if (dateParts.length < 2) return false;
    const checkYear = dateParts[0];
    const checkMonth = dateParts[1];

    const matchYear = year === 'all' || checkYear === year;
    const matchMonth = month === 'all' || checkMonth === month;

    return matchYear && matchMonth;
  });

  // Title & Headers
  const isClient = type === 'client';
  const displayMonth = language === 'fr' ? MONTH_NAMES_FR[month] : MONTH_NAMES_AR[month];
  const periodStr = month === 'all' 
    ? (year === 'all' ? 'Toutes dates' : `Année ${year}`)
    : `${displayMonth} ${year}`;

  const titleText = isClient 
    ? `Rapport des Chèques Clients - ${periodStr}`
    : `Rapport des Chèques Fournisseurs - ${periodStr}`;

  // Theme corporate color (Deep Executive Navy instead of Mauve/Purple)
  const primaryColor: [number, number, number] = [15, 32, 67]; // Professional Dark Navy Blue
  const accentColor: [number, number, number] = [241, 245, 249]; // Slate 100 bg
  const textColor: [number, number, number] = [51, 65, 85]; // slate 700 text color for body

  // Numeric formatting helper to fix thin-space rendering as '/' or wide characters
  const formatAmountStr = (num: number): string => {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // --- Draw Header ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('ChequePrime', 15, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Gestion Professionnelle de Trésorerie', 15, 24);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const subTitle = isClient ? 'RAPPORT DES REGLEMENTS CLIENTS' : 'REGLÈMENTS ET CHEQUES EMIS';
  doc.text(subTitle, 15, 34);

  // Date and meta (Top Right in Banner)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 160, 18);
  doc.text(`Période: ${periodStr}`, 160, 24);

  // --- Stats Section Below Banner ---
  const totalAmount = filteredChecks.reduce((sum, c) => sum + c.amount, 0);
  const count = filteredChecks.length;
  const pendingCount = filteredChecks.filter(c => c.status === 'pending').length;
  const pendingAmount = filteredChecks.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
  const paidCount = filteredChecks.filter(c => c.status === 'paid').length;
  const paidAmount = filteredChecks.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);

  // Summary box
  doc.setFillColor(248, 250, 252); // slate 50 Soft grey box tint
  doc.rect(15, 50, 180, 28, 'F');
  doc.setDrawColor(226, 232, 240); // slate 200 border
  doc.rect(15, 50, 180, 28);

  doc.setTextColor(30, 41, 59); // slate 800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Résumé Financier', 20, 56);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Total Chèques: ${count}`, 20, 63);
  doc.text(`Encaissé: ${formatAmountStr(paidAmount)} DH (${paidCount})`, 20, 69);
  doc.text(`En cours: ${formatAmountStr(pendingAmount)} DH (${pendingCount})`, 20, 75);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const totalLabel = isClient ? 'Total Attendu:' : 'Total Dépense:';
  doc.text(`${totalLabel} ${formatAmountStr(totalAmount)} DH`, 110, 64);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const statusLabel = filteredChecks.filter(c => c.status === 'cancelled').length;
  doc.text(`Impayés / Rejetés: ${statusLabel} chèques`, 110, 70);

  // --- Table header and rows ---
  const tableHeaders = [
    'N° chèque',
    isClient ? 'Client / Tireur' : 'Bénéficiaire',
    'Échéance',
    'Banque',
    'Motif / Cause',
    'Statut',
    'Montant'
  ];

  const tableData = filteredChecks.map(c => {
    let statusLabel = 'Encours';
    if (c.status === 'paid') statusLabel = 'Encaissé';
    if (c.status === 'cancelled') statusLabel = 'Impayé';

    return [
      c.number || '-',
      c.beneficiary || '-',
      c.dueDate ? new Date(c.dueDate).toLocaleDateString('fr-FR') : '-',
      c.bank || '-',
      c.cause || '-',
      statusLabel,
      `${formatAmountStr(c.amount)} DH`
    ];
  });


  // If no checks found
  if (filteredChecks.length === 0) {
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.text('Aucun chèque trouvé pour la période sélectionnée.', 40, 110);
  } else {
    autoTable(doc, {
      startY: 86,
      head: [tableHeaders],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 8.5
      },
      columnStyles: {
        0: { halign: 'center' },
        2: { halign: 'center' },
        5: { halign: 'center', fontStyle: 'bold' },
        6: { halign: 'right', fontStyle: 'bold' }
      },
      styles: {
        cellPadding: 3
      },
      didDrawPage: (data) => {
        // Footer message on all pages
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('ChequePrime - Application de Suivi de Chèques', 15, footerY);
        doc.text(`Page ${data.pageNumber}`, 190, footerY);
      }
    });
  }

  // Save the PDF
  const filename = isClient
    ? `Rapport_Cheques_Clients_${periodStr.replace(/\s+/g, '_')}.pdf`
    : `Rapport_Cheques_Fournisseurs_${periodStr.replace(/\s+/g, '_')}.pdf`;

  const blob = doc.output('blob');

  return {
    filename,
    periodStr,
    blob,
    doc,
    count: filteredChecks.length,
    totalAmount
  };
};
