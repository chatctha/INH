document.addEventListener('DOMContentLoaded', () => {
    const loadInput = document.getElementById('load-input');
    const pumpFilterInput = document.getElementById('pump-filter');
    const resultsBody = document.getElementById('results-body');

    let data = [];
    let headers = [];

    // Function to fetch and parse CSV data
    async function loadData() {
        try {
            const response = await fetch('MMA1.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const csvText = await response.text();
            const rows = csvText.trim().split('\n');
            headers = rows[0].split(',').map(h => h.trim());

            // Simple CSV parsing (handles quoted commas)
            data = rows.slice(1).map(row => {
                const values = [];
                let current = '';
                let inQuotes = false;
                for (let char of row) {
                    if (char === '"' && inQuotes) {
                        inQuotes = false;
                    } else if (char === '"' && !inQuotes) {
                        inQuotes = true;
                    } else if (char === ',' && !inQuotes) {
                        values.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                values.push(current.trim());

                const rowData = {};
                headers.forEach((header, index) => {
                    rowData[header] = values[index];
                });
                return rowData;
            });

            updateTable();
        } catch (error) {
            console.error("Failed to load or parse MMA1.csv:", error);
            resultsBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: red;">Error loading data. Please check the console.</td></tr>`;
        }
    }

    // Function to find the correct column based on load percentage
    function findColumnForLoad(load) {
        if (load === null || typeof load === 'undefined' || isNaN(load)) return null;

        for (const header of headers.slice(4)) { // Start checking from percentage columns
            const match = header.match(/(\d+)-(\d+)%/);
            if (match) {
                const min = parseInt(match[1], 10);
                const max = parseInt(match[2], 10);
                if (load >= min && load <= max) {
                    return header;
                }
            }
        }
        if (load >= 1 && load <= 60) return "1-60%";
        return null;
    }

    // Function to update and render the table
    function updateTable() {
        const loadValue = parseFloat(loadInput.value);
        const filterText = pumpFilterInput.value.toLowerCase();

        if (isNaN(loadValue)) {
            resultsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Please enter a Load % value.</td></tr>';
            return;
        }

        const targetColumn = findColumnForLoad(loadValue);

        if (!targetColumn) {
             resultsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Load % is out of range.</td></tr>';
            return;
        }

        const filteredData = data.filter(row => {
            const pumpName = row['Feed pump'] || ''; // Corrected key
            return pumpName.toLowerCase().includes(filterText);
        });

        renderTable(filteredData, targetColumn);
    }

    // Function to render data into the table
    function renderTable(dataToRender, valueColumn) {
        if (dataToRender.length === 0) {
            resultsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No matching data found.</td></tr>';
            return;
        }

        let html = '';
        dataToRender.forEach(row => {
            html += `
                <tr>
                    <td>${row['Feed pump'] || ''}</td>
                    <td>${row['Destination'] || ''}</td>
                    <td>${row['Inhibitor'] || ''}</td>
                    <td>${row['Drum'] || ''}</td>
                    <td>${row[valueColumn] || 'N/A'}</td>
                </tr>
            `; // Corrected keys
        });
        resultsBody.innerHTML = html;
    }

    // Add event listeners
    loadInput.addEventListener('input', updateTable);
    pumpFilterInput.addEventListener('input', updateTable);

    // Initial data load
    loadData();
});
