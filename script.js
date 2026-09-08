// LocalStorage Key
const STORAGE_KEY = 'AEURAN_BR_AI_DATA';

// Application State
let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
  products: {},
  lastActiveProduct: null,
  additionalCost: 0
};

// DOM Elements
const productSelect = document.getElementById('product-select');
const newProductNameInput = document.getElementById('new-product-name');
const addProductBtn = document.getElementById('add-product-btn');
const activeProductTitle = document.getElementById('active-product-title');

const dailyForm = document.getElementById('daily-data-form');
const entryDate = document.getElementById('entry-date');
const supplierCost = document.getElementById('supplier-cost');
const fbaFee = document.getElementById('fba-fee');
const salePrice = document.getElementById('sale-price');
const unitsSold = document.getElementById('units-sold');
const adSpend = document.getElementById('ad-spend');

const totalUnitsEl = document.getElementById('total-units');
const totalSalesEl = document.getElementById('total-sales');
const totalAdSpendEl = document.getElementById('total-ad-spend');
const acosEl = document.getElementById('acos-val');
const roasEl = document.getElementById('roas-val');
const grossProfitEl = document.getElementById('gross-profit');
const additionalCostInput = document.getElementById('additional-cost');
const finalNetProfitEl = document.getElementById('final-net-profit');

const tableBody = document.getElementById('table-body');
const monthEndNotice = document.getElementById('month-end-notice');

// Initialize App
function init() {
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  entryDate.value = today;

  checkMonthEndNotice();
  renderProductDropdown();

  if (appData.lastActiveProduct && appData.products[appData.lastActiveProduct]) {
    productSelect.value = appData.lastActiveProduct;
  }
  
  handleProductChange();
  additionalCostInput.value = appData.additionalCost || 0;
}

// Save State to LocalStorage
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

// Month End Notice Checker
function checkMonthEndNotice() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (tomorrow.getDate() === 1) {
    monthEndNotice.classList.remove('hidden');
  } else {
    monthEndNotice.classList.add('hidden');
  }
}

// Render Dropdown
function renderProductDropdown() {
  productSelect.innerHTML = '';
  const productKeys = Object.keys(appData.products);

  if (productKeys.length === 0) {
    productSelect.innerHTML = '<option value="">কোনো প্রোডাক্ট নেই (নতুন যোগ করুন)</option>';
    return;
  }

  productKeys.forEach(prod => {
    const option = document.createElement('option');
    option.value = prod;
    option.textContent = prod;
    productSelect.appendChild(option);
  });
}

// Add Product
addProductBtn.addEventListener('click', () => {
  const pName = newProductNameInput.value.trim();
  if (!pName) return alert('প্রোডাক্টের নাম লিখুন!');

  if (!appData.products[pName]) {
    appData.products[pName] = [];
    appData.lastActiveProduct = pName;
    saveData();
    renderProductDropdown();
    productSelect.value = pName;
    handleProductChange();
    newProductNameInput.value = '';
  } else {
    alert('এই নামের প্রোডাক্ট ইতিমধ্যে রয়েছে!');
  }
});

// Switch Product
productSelect.addEventListener('change', handleProductChange);

function handleProductChange() {
  const selectedProduct = productSelect.value;
  appData.lastActiveProduct = selectedProduct;
  saveData();

  if (!selectedProduct || !appData.products[selectedProduct]) {
    activeProductTitle.textContent = 'কোনো প্রোডাক্ট সিলেক্ট করা নেই';
    tableBody.innerHTML = '';
    resetDashboard();
    return;
  }

  activeProductTitle.textContent = selectedProduct;
  autoFillLastPrices(selectedProduct);
  renderTableAndDashboard(selectedProduct);
}

// Auto Fill Previous Day Values for Convenience
function autoFillLastPrices(productName) {
  const entries = appData.products[productName];
  if (entries && entries.length > 0) {
    const lastEntry = entries[entries.length - 1];
    supplierCost.value = lastEntry.supplierCost;
    fbaFee.value = lastEntry.fbaFee;
    salePrice.value = lastEntry.salePrice;
  } else {
    supplierCost.value = '';
    fbaFee.value = '';
    salePrice.value = '';
  }
  unitsSold.value = '';
  adSpend.value = '';
}

// Save Daily Entry
dailyForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const selectedProduct = productSelect.value;
  if (!selectedProduct) return alert('প্রথমে একটি প্রোডাক্ট সিলেক্ট করুন!');

  const entry = {
    date: entryDate.value,
    supplierCost: parseFloat(supplierCost.value) || 0,
    fbaFee: parseFloat(fbaFee.value) || 0,
    salePrice: parseFloat(salePrice.value) || 0,
    unitsSold: parseInt(unitsSold.value) || 0,
    adSpend: parseFloat(adSpend.value) || 0
  };

  let productEntries = appData.products[selectedProduct];

  // Check if date already exists (update existing date record)
  const existingIdx = productEntries.findIndex(e => e.date === entry.date);
  if (existingIdx >= 0) {
    productEntries[existingIdx] = entry;
  } else {
    productEntries.push(entry);
  }

  // Sort entries by date ascending
  productEntries.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Limit to last 30 entries per product
  if (productEntries.length > 30) {
    productEntries = productEntries.slice(productEntries.length - 30);
    appData.products[selectedProduct] = productEntries;
  }

  saveData();
  renderTableAndDashboard(selectedProduct);
  alert('ডেটা সফলভাবে সেভ হয়েছে!');
});

// Render Table & Calculate Dashboard
function renderTableAndDashboard(productName) {
  const entries = appData.products[productName] || [];
  tableBody.innerHTML = '';

  let totalUnits = 0;
  let totalSales = 0;
  let totalAdSpend = 0;
  let totalCost = 0;

  entries.forEach((item, index) => {
    const rev = item.unitsSold * item.salePrice;
    const prodCost = item.unitsSold * (item.supplierCost + item.fbaFee);
    const dayProfit = rev - (prodCost + item.adSpend);

    totalUnits += item.unitsSold;
    totalSales += rev;
    totalAdSpend += item.adSpend;
    totalCost += (prodCost + item.adSpend);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.date}</td>
      <td>$${item.supplierCost.toFixed(2)}</td>
      <td>$${item.fbaFee.toFixed(2)}</td>
      <td>$${item.salePrice.toFixed(2)}</td>
      <td>${item.unitsSold}</td>
      <td>$${item.adSpend.toFixed(2)}</td>
      <td>$${rev.toFixed(2)}</td>
      <td style="color: ${dayProfit >= 0 ? '#10b981' : '#ef4444'}; font-weight: bold;">
        $${dayProfit.toFixed(2)}
      </td>
      <td><button onclick="deleteEntry('${productName}', ${index})" style="background:red; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">❌</button></td>
    `;
    tableBody.appendChild(tr);
  });

  // Calculate Metrics
  const grossProfit = totalSales - totalCost;
  const acos = totalSales > 0 ? (totalAdSpend / totalSales) * 100 : 0;
  const roas = totalAdSpend > 0 ? (totalSales / totalAdSpend) : 0;

  // Update UI Elements
  totalUnitsEl.textContent = totalUnits;
  totalSalesEl.textContent = `$${totalSales.toFixed(2)}`;
  totalAdSpendEl.textContent = `$${totalAdSpend.toFixed(2)}`;
  acosEl.textContent = `${acos.toFixed(2)}%`;
  roasEl.textContent = `${roas.toFixed(2)}x`;
  
  grossProfitEl.textContent = `$${grossProfit.toFixed(2)}`;
  grossProfitEl.style.color = grossProfit >= 0 ? '#10b981' : '#ef4444';

  calculateFinalProfit(grossProfit);
}

// Calculate Final Net Profit with Additional Cost
additionalCostInput.addEventListener('input', () => {
  const currentProduct = productSelect.value;
  appData.additionalCost = parseFloat(additionalCostInput.value) || 0;
  saveData();
  if (currentProduct) {
    renderTableAndDashboard(currentProduct);
  }
});

function calculateFinalProfit(grossProfit) {
  const extraCost = parseFloat(additionalCostInput.value) || 0;
  const finalProfit = grossProfit - extraCost;

  finalNetProfitEl.textContent = `$${finalProfit.toFixed(2)}`;
  if (finalProfit >= 0) {
    finalNetProfitEl.className = 'profit-positive';
  } else {
    finalNetProfitEl.className = 'profit-negative';
  }
}

// Delete Entry Function
window.deleteEntry = function(productName, index) {
  if (confirm('আপনি কি এই ডেটা এন্ট্রিটি মুছে ফেলতে চান?')) {
    appData.products[productName].splice(index, 1);
    saveData();
    renderTableAndDashboard(productName);
  }
};

function resetDashboard() {
  totalUnitsEl.textContent = '0';
  totalSalesEl.textContent = '$0.00';
  totalAdSpendEl.textContent = '$0.00';
  acosEl.textContent = '0.00%';
  roasEl.textContent = '0.00x';
  grossProfitEl.textContent = '$0.00';
  finalNetProfitEl.textContent = '$0.00';
}

// Export Custom Date Range Data to Excel
document.getElementById('export-btn').addEventListener('click', () => {
  const productName = productSelect.value;
  if (!productName || !appData.products[productName]) {
    return alert('রিপোর্ট তৈরি করতে একটি প্রোডাক্ট বেছে নিন!');
  }

  const fromDate = document.getElementById('export-from').value;
  const toDate = document.getElementById('export-to').value;

  let entries = appData.products[productName];

  if (fromDate && toDate) {
    entries = entries.filter(e => e.date >= fromDate && e.date <= toDate);
  }

  if (entries.length === 0) {
    return alert('সিলেক্ট করা ডেট রেঞ্জে কোনো তথ্য নেই!');
  }

  // Format data for sheet
  const exportData = entries.map(item => {
    const rev = item.unitsSold * item.salePrice;
    const cost = item.unitsSold * (item.supplierCost + item.fbaFee);
    const profit = rev - (cost + item.adSpend);

    return {
      "Date": item.date,
      "Product": productName,
      "Supplier Cost ($)": item.supplierCost,
      "FBA Fee ($)": item.fbaFee,
      "Sale Price ($)": item.salePrice,
      "Units Sold": item.unitsSold,
      "Ad Spend ($)": item.adSpend,
      "Total Revenue ($)": rev,
      "Net Profit/Loss ($)": profit
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  XLSX.writeFile(workbook, `${productName}_Report_${fromDate || 'All'}_to_${toDate || 'All'}.xlsx`);
});

// App Startup
init();