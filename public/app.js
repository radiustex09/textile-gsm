document.addEventListener('DOMContentLoaded', () => {
    // Quick-jump navigation across all 4 calculators on single page
    const tabBtns = document.querySelectorAll('.tab-btn');
    const calcCards = document.querySelectorAll('.calculator-card');
    const calculatorsWrapper = document.getElementById('calculators-wrapper');
    const btnGridLayout = document.getElementById('btn-grid-layout');
    const btnStackedLayout = document.getElementById('btn-stacked-layout');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const targetCard = document.getElementById(targetId);

            if (targetCard) {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Smooth scroll to selected calculator
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Highlight card briefly to guide the user's eye
                calcCards.forEach(c => c.classList.remove('highlight'));
                targetCard.classList.add('highlight');
                setTimeout(() => {
                    targetCard.classList.remove('highlight');
                }, 1800);
            }
        });
    });

    // Layout switcher (2 Columns vs Stacked)
    if (btnGridLayout && btnStackedLayout && calculatorsWrapper) {
        btnGridLayout.addEventListener('click', () => {
            calculatorsWrapper.classList.remove('stacked');
            btnGridLayout.classList.add('active');
            btnStackedLayout.classList.remove('active');
        });

        btnStackedLayout.addEventListener('click', () => {
            calculatorsWrapper.classList.add('stacked');
            btnStackedLayout.classList.add('active');
            btnGridLayout.classList.remove('active');
        });
    }

    // Auto-update active nav tab on scroll
    if ('IntersectionObserver' in window && calcCards.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    tabBtns.forEach(btn => {
                        if (btn.dataset.target === id) {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    });
                }
            });
        }, {
            threshold: 0.35,
            rootMargin: '-96px 0px -40% 0px'
        });

        calcCards.forEach(card => observer.observe(card));
    }

    // Top Navigation active state handler & scrollspy
    const mainNavLinks = document.querySelectorAll('.nav .nav-link');
    mainNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            mainNavLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    const headerLogo = document.querySelector('.logo');
    if (headerLogo) {
        headerLogo.addEventListener('click', () => {
            mainNavLinks.forEach(l => l.classList.remove('active'));
            const firstLink = document.querySelector('.nav .nav-link[href="#woven-calculator"]');
            if (firstLink) firstLink.classList.add('active');
        });
    }

    const pageSections = document.querySelectorAll('main > section, footer#contact');
    if ('IntersectionObserver' in window && pageSections.length > 0) {
        const navObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    mainNavLinks.forEach(link => {
                        const href = link.getAttribute('href');
                        if (href === `#${sectionId}` || (sectionId === 'contact' && href === '#contact')) {
                            mainNavLinks.forEach(l => l.classList.remove('active'));
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, {
            threshold: 0.25,
            rootMargin: '-96px 0px -40% 0px'
        });

        pageSections.forEach(sec => navObserver.observe(sec));
    }

    // Layer Management for Nonwoven
    const addLayerBtn = document.getElementById('add-layer-btn');
    const layersContainer = document.getElementById('layers-container');
    let layerCount = 1;

    addLayerBtn.addEventListener('click', () => {
        layerCount++;
        const div = document.createElement('div');
        div.className = 'layer-item mt-1';
        div.innerHTML = `
            <h4>Layer ${layerCount}</h4>
            <div class="input-group">
                <label>Estimated GSM</label>
                <input type="number" class="layer-gsm" step="0.1" required>
            </div>
        `;
        layersContainer.appendChild(div);
    });

    // Helper: Convert to meters
    function toMeters(val, unit) {
        if (unit === 'cm') return val / 100;
        if (unit === 'inch') return val * 0.0254;
        return val;
    }

    // Convert supported yarn-count systems to linear density in tex.
    // Ne is cotton count; Nm is metric count; denier and dtex are direct mass/length systems.
    function convertToTex(value, system) {
        switch(system) {
            case 'Ne': return 590.5 / value;
            case 'Nm': return 1000 / value;
            case 'tex': return value;
            case 'denier': return value / 9;
            case 'dtex': return value / 10;
            default: return NaN;
        }
    }

    // Keep results from each calculation method separate. These are alternatives,
    // except for physical layers entered in the layered calculator.
    const gsmResults = {
        measured: null,
        woven: null,
        knitted: null,
        nonwoven: null
    };
    function updateMethodSummary() {
        const methods = [
            { key: 'measured', valueId: 'summary-m-val', boxId: 'metric-box-measured', statusId: 'status-m' },
            { key: 'woven', valueId: 'summary-w-val', boxId: 'metric-box-woven', statusId: 'status-w' },
            { key: 'knitted', valueId: 'summary-k-val', boxId: 'metric-box-knitted', statusId: 'status-k' },
            { key: 'nonwoven', valueId: 'summary-nw-val', boxId: 'metric-box-nonwoven', statusId: 'status-nw' }
        ];

        methods.forEach(({ key, valueId, boxId, statusId }) => {
            const value = gsmResults[key];
            if (value === null) return;
            document.getElementById(valueId).innerText = value.toFixed(2);
            document.getElementById(boxId).classList.add('calculated');
            const status = document.getElementById(statusId);
            status.innerText = 'Calculated ✓';
            status.classList.add('active');
        });
    }

    // Measured GSM Calculation
    document.getElementById('measured-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const weight = parseFloat(document.getElementById('m-weight').value);
        const length = parseFloat(document.getElementById('m-length').value);
        const lUnit = document.getElementById('m-length-unit').value;
        const width = parseFloat(document.getElementById('m-width').value);
        const wUnit = document.getElementById('m-width-unit').value;

        const lengthM = toMeters(length, lUnit);
        const widthM = toMeters(width, wUnit);
        const area = lengthM * widthM;

        if (area > 0) {
            const gsm = weight / area;
            gsmResults.measured = gsm;
            document.getElementById('m-result-val').innerText = gsm.toFixed(2);
            document.getElementById('measured-result').classList.remove('hidden');
            window.currentReport = {
                type: 'Measured GSM',
                details: `Weight: ${weight}g, Area: ${area.toFixed(4)}m²`,
                result: `${gsm.toFixed(2)} g/m²`
            };
            updateMethodSummary();
        }
    });

    // Woven Estimated GSM Calculation
    document.getElementById('woven-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const system = document.getElementById('w-count-system').value;
        const warpCountRaw = parseFloat(document.getElementById('w-warp-count').value);
        const weftCountRaw = parseFloat(document.getElementById('w-weft-count').value);
        
        const warpTex = convertToTex(warpCountRaw, system);
        const weftTex = convertToTex(weftCountRaw, system);

        const epi = parseFloat(document.getElementById('w-epi').value);
        const ppi = parseFloat(document.getElementById('w-ppi').value);
        const warpCrimp = parseFloat(document.getElementById('w-warp-crimp').value);
        const weftCrimp = parseFloat(document.getElementById('w-weft-crimp').value);

        // EPI/PPI are per inch. Convert to ends/picks per metre, then multiply
        // by yarn tex (g/km) and the yarn-length allowance for crimp.
        const inchToMetres = 1 / 0.0254;
        const warpGSM = (epi * inchToMetres * warpTex / 1000) * (1 + warpCrimp / 100);
        const weftGSM = (ppi * inchToMetres * weftTex / 1000) * (1 + weftCrimp / 100);
        const totalGSM = warpGSM + weftGSM;

        gsmResults.woven = totalGSM;
        document.getElementById('w-warp-contrib').innerText = warpGSM.toFixed(2) + ' g/m²';
        document.getElementById('w-weft-contrib').innerText = weftGSM.toFixed(2) + ' g/m²';
        document.getElementById('w-result-val').innerText = totalGSM.toFixed(2);
        
        document.getElementById('woven-result').classList.remove('hidden');

        const fabricState = document.getElementById('w-fabric-state').value;
        window.currentReport = {
            type: 'Estimated Woven GSM',
            details: `State: ${fabricState}, Warp: ${warpCountRaw} ${system}, Weft: ${weftCountRaw} ${system} | EPI: ${epi}, PPI: ${ppi}, warp/weft crimp: ${warpCrimp}%/${weftCrimp}%`,
            result: `${totalGSM.toFixed(2)} g/m² (Estimate)`
        };
        updateMethodSummary();
    });

    // Knitted Estimated GSM Calculation
    document.getElementById('knitted-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const count = parseFloat(document.getElementById('k-count').value);
        const system = document.getElementById('k-count-system').value;
        const stitch = parseFloat(document.getElementById('k-stitch').value);
        const wpc = parseFloat(document.getElementById('k-wales').value);
        const cpc = parseFloat(document.getElementById('k-courses').value);

        // WPC/CPC are per cm; the loop geometry yields 0.01 × stitch(mm) ×
        // WPC × CPC metres of yarn per square metre, multiplied by tex (g/km).
        const countTex = convertToTex(count, system);
        const gsm = 0.01 * stitch * wpc * cpc * countTex;
        gsmResults.knitted = gsm;

        document.getElementById('k-result-val').innerText = gsm.toFixed(2);
        document.getElementById('knitted-result').classList.remove('hidden');

        window.currentReport = {
            type: 'Estimated Knitted GSM',
            details: `Count: ${count} ${system}, Stitch: ${stitch}mm, WPC: ${wpc}/cm, CPC: ${cpc}/cm`,
            result: `${gsm.toFixed(2)} g/m² (Estimate)`
        };
        updateMethodSummary();
    });

    // Nonwoven Estimated GSM
    document.getElementById('nonwoven-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const inputs = document.querySelectorAll('.layer-gsm');
        let total = 0;
        inputs.forEach(input => {
            total += parseFloat(input.value) || 0;
        });

        gsmResults.nonwoven = total;
        document.getElementById('nw-result-val').innerText = total.toFixed(2);
        document.getElementById('nonwoven-result').classList.remove('hidden');

        window.currentReport = {
            type: 'Estimated Nonwoven/Layered GSM',
            details: `${inputs.length} Layers combined`,
            result: `${total.toFixed(2)} g/m² (Estimate)`
        };
        updateMethodSummary();
    });

    // Calculate only completed user-entered forms. Never insert demo values.
    const btnCalcAll = document.getElementById('btn-calc-all');
    if (btnCalcAll) {
        btnCalcAll.addEventListener('click', () => {
            const forms = ['measured-form', 'woven-form', 'knitted-form', 'nonwoven-form']
                .map(id => document.getElementById(id));
            const hasAnyValue = form => [...form.querySelectorAll('input')]
                .some(input => input.value.trim() !== '');
            const startedForms = forms.filter(hasAnyValue);
            const completeForms = startedForms.filter(form => form.checkValidity());
            const skippedCount = startedForms.length - completeForms.length;
            const feedback = document.getElementById('calc-all-feedback');

            if (completeForms.length === 0) {
                feedback.innerText = startedForms.length === 0
                    ? 'Enter values in a calculator first; no example values are inserted.'
                    : 'No complete calculator form found. Finish the values in a form and try again.';
                return;
            }

            completeForms.forEach(form => form.requestSubmit());
            feedback.innerText = `Calculated ${completeForms.length} completed form${completeForms.length === 1 ? '' : 's'}${skippedCount ? `; skipped ${skippedCount} incomplete form${skippedCount === 1 ? '' : 's'}` : ''}. These results remain separate.`;

            // Smooth scroll down to Grand Hub
            const grandCard = document.getElementById('grand-gsm-card');
            if (grandCard) {
                grandCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    // Consolidated Print Report
    const btnPrintConsolidated = document.getElementById('btn-print-consolidated');
    if (btnPrintConsolidated) {
        btnPrintConsolidated.addEventListener('click', () => {
            const mVal = gsmResults.measured !== null ? `${gsmResults.measured.toFixed(2)} g/m²` : 'Not tested';
            const wVal = gsmResults.woven !== null ? `${gsmResults.woven.toFixed(2)} g/m²` : 'Not tested';
            const kVal = gsmResults.knitted !== null ? `${gsmResults.knitted.toFixed(2)} g/m²` : 'Not tested';
            const nwVal = gsmResults.nonwoven !== null ? `${gsmResults.nonwoven.toFixed(2)} g/m²` : 'Not tested';
            const content = `
                <div class="report-content">
                    <h2 style="margin-bottom: 0.5rem;">Comprehensive Textile GSM Analysis Report</h2>
                    <p style="color: #666; margin-bottom: 1.5rem;">Generated on ${new Date().toLocaleString()}</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
                        <thead>
                            <tr style="background: #f3f4f6;">
                                <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Test Method</th>
                                <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Calculated GSM</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 10px;">📏 Measured GSM (Direct Weight)</td>
                                <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-weight: bold;">${mVal}</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 10px;">🧵 Estimated Woven Fabric GSM</td>
                                <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-weight: bold;">${wVal}</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 10px;">🪡 Knitted Fabric GSM</td>
                                <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-weight: bold;">${kVal}</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 10px;">🧻 Nonwoven / Layered GSM</td>
                                <td style="border: 1px solid #ddd; padding: 10px; text-align: right; font-weight: bold;">${nwVal}</td>
                            </tr>
                        </tbody>
                    </table>

                    <p>These are separate calculation methods; do not add or average their results. Only add GSM values for physical layers that cover the same area, using the layered calculator.</p>
                    <p>Measured GSM is a direct sample result. Woven and knitted values are estimates based on the entered construction. This report does not certify compliance with a test standard.</p>
                    <hr style="margin: 20px 0;">
                    <p><em>For formal acceptance testing, follow the applicable test method and its sample preparation and conditioning requirements (for example, ASTM D3776).</em></p>
                </div>
            `;
            document.getElementById('report-content').innerHTML = content;
            window.print();
        });
    }

    // Individual Print Report
    const printBtns = document.querySelectorAll('.print-report');
    printBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (window.currentReport) {
                const content = `
                    <div class="report-content">
                        <h3>${window.currentReport.type}</h3>
                        <p><strong>Parameters:</strong> ${window.currentReport.details}</p>
                        <p><strong>Calculated Result:</strong> ${window.currentReport.result}</p>
                        <hr style="margin: 20px 0;">
                        <p><em>Note: Estimated results may vary from actual weighed samples.</em></p>
                    </div>
                `;
                document.getElementById('report-content').innerHTML = content;
                window.print();
            }
        });
    });

    // Design Studio Integration
    let selectedImageFile = null;
    const fileInput = document.getElementById('ds-image');
    const previewContainer = document.getElementById('ds-preview-container');
    const previewImage = document.getElementById('ds-preview');

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) {
            selectedImageFile = null;
            previewContainer.classList.add('hidden');
            return;
        }

        const notice = document.getElementById('api-status');
        notice.classList.add('hidden'); // Clear previous notices

        if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heif') || file.type === 'image/heif') {
            notice.classList.remove('hidden', 'success', 'error');
            notice.innerText = 'Converting HEIC format, please wait...';
            notice.classList.add('success');
            
            try {
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: 'image/jpeg',
                    quality: 0.8
                });
                const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                selectedImageFile = new File([blob], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' });
                
                notice.classList.add('hidden');
            } catch (error) {
                console.error(error);
                notice.classList.remove('hidden', 'success');
                notice.innerText = 'Error: Failed to convert HEIC image. Please try a different image.';
                notice.className = 'api-notice error';
                selectedImageFile = null;
                previewContainer.classList.add('hidden');
                fileInput.value = ''; // clear input
                return;
            }
        } else {
            selectedImageFile = file;
        }

        if (selectedImageFile) {
            previewImage.src = URL.createObjectURL(selectedImageFile);
            previewContainer.classList.remove('hidden');
        }
    });

    document.getElementById('design-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const notice = document.getElementById('api-status');
        const container = document.getElementById('designs-container');
        
        notice.classList.remove('hidden', 'success', 'error');
        notice.innerText = 'Generating designs... please wait.';
        notice.classList.add('success'); // just for color during loading
        
        const formData = new FormData();
        if (selectedImageFile) {
            formData.append('referenceImage', selectedImageFile);
        }
        formData.append('garmentType', document.getElementById('ds-type').value);
        formData.append('variations', document.getElementById('ds-variations').value);
        formData.append('colors', document.getElementById('ds-colors').value);
        formData.append('details', document.getElementById('ds-details').value);

        try {
            const res = await fetch('/api/generate-designs', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'API Error');
            }

            notice.innerText = 'API response received. ' + data.message;
            notice.className = 'api-notice success';

            // If images were actually returned, we would render them:
            if (data.images && data.images.length > 0) {
                container.innerHTML = data.images.map(img => `
                    <div class="design-item">
                        <img src="${img.url}" alt="Generated Design" onerror="this.onerror=null; setTimeout(() => this.src='${img.url}&retry=' + Math.random(), 2000);">
                        <div class="design-overlay">
                            <button class="design-action">Download</button>
                            <button class="design-action">Regenerate</button>
                        </div>
                    </div>
                `).join('');
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>No images returned. Ensure the API key is configured on the server.</p>
                    </div>
                `;
            }

        } catch (error) {
            notice.innerText = 'Error: ' + error.message;
            notice.className = 'api-notice error';
        }
    });

    // =========================================================
    // Woven Fabric GSM Calculator (Unit-Correct Mill Formula & ASTM D3776)
    // Formula:
    // W = (EPI × 39.54² × 453.6) ÷ (840 × 36 × Warp Ne) × (1 + Warp Crimp% ÷ 100)
    // V = (PPI × 39.54² × 453.6) ÷ (840 × 36 × Weft Ne) × (1 + Weft Crimp% ÷ 100)
    // Total Fabric Weight (GSM) = W + V
    // =========================================================

    // Conversion helper: Convert any yarn count system to standard Tex
    function convertAnyToTex(val, system) {
        if (!val || val <= 0) return null;
        switch (system) {
            case 'Ne': return 590.5 / val;
            case 'Nm': return 1000.0 / val;
            case 'Denier': return val / 9.0;
            case 'Tex': return val;
            default: return val;
        }
    }

    // Conversion helper: Convert any yarn count system to English Cotton Count (Ne)
    function convertAnyToNe(val, system) {
        if (!val || val <= 0) return null;
        switch (system) {
            case 'Ne': return val;
            case 'Tex': return 590.5 / val;
            case 'Nm': return val * 0.5905;
            case 'Denier': return 5314.5 / val;
            default: return val;
        }
    }

    // Convert dimensions to centimeters
    function toCentimeters(val, unit) {
        if (!val || val <= 0) return 0;
        switch (unit) {
            case 'cm': return val;
            case 'inch': return val * 2.54;
            case 'mm': return val / 10.0;
            case 'm': return val * 100.0;
            default: return val;
        }
    }

    const advWarpCount = document.getElementById('adv-warp-count');
    const advWarpSystem = document.getElementById('adv-warp-system');
    const advWarpTexHint = document.getElementById('adv-warp-tex-hint');

    const advWeftCount = document.getElementById('adv-weft-count');
    const advWeftSystem = document.getElementById('adv-weft-system');
    const advWeftTexHint = document.getElementById('adv-weft-tex-hint');

    const advEPI = document.getElementById('adv-epi');
    const advPPI = document.getElementById('adv-ppi');
    const advWarpCrimp = document.getElementById('adv-warp-crimp');
    const advWeftCrimp = document.getElementById('adv-weft-crimp');

    const advWovenForm = document.getElementById('advanced-woven-form');
    const wovenErrorAlert = document.getElementById('woven-error-alert');

    // Live Yarn Count Hints (displaying both Ne and Tex)
    function updateTexHints() {
        if (advWarpCount && advWarpSystem && advWarpTexHint) {
            const wVal = parseFloat(advWarpCount.value);
            const wSys = advWarpSystem.value;
            const wNe = convertAnyToNe(wVal, wSys);
            const wTex = convertAnyToTex(wVal, wSys);
            if (wNe && wNe > 0) {
                if (wSys === 'Ne') {
                    advWarpTexHint.innerText = `Count: ${wNe.toFixed(2)} Ne (${wTex.toFixed(2)} Tex)`;
                } else {
                    advWarpTexHint.innerText = `Equivalent: ${wNe.toFixed(2)} Ne (${wTex.toFixed(2)} Tex)`;
                }
            } else {
                advWarpTexHint.innerText = 'Equivalent: — Ne';
            }
        }

        if (advWeftCount && advWeftSystem && advWeftTexHint) {
            const fVal = parseFloat(advWeftCount.value);
            const fSys = advWeftSystem.value;
            const fNe = convertAnyToNe(fVal, fSys);
            const fTex = convertAnyToTex(fVal, fSys);
            if (fNe && fNe > 0) {
                if (fSys === 'Ne') {
                    advWeftTexHint.innerText = `Count: ${fNe.toFixed(2)} Ne (${fTex.toFixed(2)} Tex)`;
                } else {
                    advWeftTexHint.innerText = `Equivalent: ${fNe.toFixed(2)} Ne (${fTex.toFixed(2)} Tex)`;
                }
            } else {
                advWeftTexHint.innerText = 'Equivalent: — Ne';
            }
        }
    }

    if (advWarpCount) advWarpCount.addEventListener('input', updateTexHints);
    if (advWarpSystem) advWarpSystem.addEventListener('change', updateTexHints);
    if (advWeftCount) advWeftCount.addEventListener('input', updateTexHints);
    if (advWeftSystem) advWeftSystem.addEventListener('change', updateTexHints);

    // Collapsible Yarn Sample Mode
    const toggleYarnBtn = document.getElementById('toggle-yarn-sample-mode');
    const yarnPanel = document.getElementById('yarn-sample-mode-panel');
    const yarnToggleIcon = document.getElementById('yarn-toggle-icon');
    const yarnSampleWeight = document.getElementById('yarn-sample-weight');
    const yarnSampleLength = document.getElementById('yarn-sample-length');
    const yarnSampleTexVal = document.getElementById('yarn-sample-tex-val');
    const yarnSampleNeVal = document.getElementById('yarn-sample-ne-val');
    const applySampleWarp = document.getElementById('apply-sample-to-warp');
    const applySampleWeft = document.getElementById('apply-sample-to-weft');

    let currentCalculatedSampleTex = null;
    let currentCalculatedSampleNe = null;

    if (toggleYarnBtn && yarnPanel) {
        toggleYarnBtn.addEventListener('click', () => {
            const isHidden = yarnPanel.classList.toggle('hidden');
            if (yarnToggleIcon) yarnToggleIcon.innerText = isHidden ? '+' : '−';
            toggleYarnBtn.setAttribute('aria-expanded', !isHidden);
        });
    }

    function updateYarnSampleTex() {
        if (!yarnSampleWeight || !yarnSampleLength || !yarnSampleTexVal) return;
        const w = parseFloat(yarnSampleWeight.value);
        const l = parseFloat(yarnSampleLength.value);

        if (w > 0 && l > 0) {
            // Tex = weight (g) × 1000 ÷ length (m)
            // Ne = 590.5 ÷ Tex
            const tex = (w * 1000) / l;
            const ne = 590.5 / tex;
            currentCalculatedSampleTex = tex;
            currentCalculatedSampleNe = ne;
            yarnSampleTexVal.innerText = tex.toFixed(2);
            if (yarnSampleNeVal) yarnSampleNeVal.innerText = ne.toFixed(2);
        } else {
            currentCalculatedSampleTex = null;
            currentCalculatedSampleNe = null;
            yarnSampleTexVal.innerText = '—';
            if (yarnSampleNeVal) yarnSampleNeVal.innerText = '—';
        }
    }

    if (yarnSampleWeight) yarnSampleWeight.addEventListener('input', updateYarnSampleTex);
    if (yarnSampleLength) yarnSampleLength.addEventListener('input', updateYarnSampleTex);

    if (applySampleWarp) {
        applySampleWarp.addEventListener('click', () => {
            if (currentCalculatedSampleNe && currentCalculatedSampleNe > 0) {
                advWarpCount.value = currentCalculatedSampleNe.toFixed(2);
                advWarpSystem.value = 'Ne';
                updateTexHints();
                runWovenCalculation();
            } else {
                alert('Please enter valid yarn sample weight and length first.');
            }
        });
    }

    if (applySampleWeft) {
        applySampleWeft.addEventListener('click', () => {
            if (currentCalculatedSampleNe && currentCalculatedSampleNe > 0) {
                advWeftCount.value = currentCalculatedSampleNe.toFixed(2);
                advWeftSystem.value = 'Ne';
                updateTexHints();
                runWovenCalculation();
            } else {
                alert('Please enter valid yarn sample weight and length first.');
            }
        });
    }

    // Fabric Swatch Presets
    const swatchWeight = document.getElementById('swatch-weight');
    const swatchWidth = document.getElementById('swatch-width');
    const swatchWidthUnit = document.getElementById('swatch-width-unit');
    const swatchLength = document.getElementById('swatch-length');
    const swatchLengthUnit = document.getElementById('swatch-length-unit');

    const btn1x1in = document.getElementById('swatch-preset-1x1in');
    const btn10x10cm = document.getElementById('swatch-preset-10x10cm');
    const btn100x100cm = document.getElementById('swatch-preset-100x100cm');

    if (btn1x1in) {
        btn1x1in.addEventListener('click', () => {
            swatchWidth.value = '1';
            swatchWidthUnit.value = 'inch';
            swatchLength.value = '1';
            swatchLengthUnit.value = 'inch';
            if (swatchWeight && !swatchWeight.value) swatchWeight.value = '0.067';
            runWovenCalculation();
        });
    }

    if (btn10x10cm) {
        btn10x10cm.addEventListener('click', () => {
            swatchWidth.value = '10';
            swatchWidthUnit.value = 'cm';
            swatchLength.value = '10';
            swatchLengthUnit.value = 'cm';
            if (swatchWeight && !swatchWeight.value) swatchWeight.value = '1.038';
            runWovenCalculation();
        });
    }

    if (btn100x100cm) {
        btn100x100cm.addEventListener('click', () => {
            swatchWidth.value = '100';
            swatchWidthUnit.value = 'cm';
            swatchLength.value = '100';
            swatchLengthUnit.value = 'cm';
            if (swatchWeight && !swatchWeight.value) swatchWeight.value = '103.8';
            runWovenCalculation();
        });
    }

    // Target GSM and Tolerance elements
    const advTargetGSM = document.getElementById('adv-target-gsm');
    const advTargetTol = document.getElementById('adv-target-tolerance');
    const advTolBox = document.getElementById('adv-tolerance-status-box');
    const advTolBadge = document.getElementById('adv-tolerance-badge');
    const advTolRangeText = document.getElementById('adv-tolerance-range-text');

    // Preset Loader: 23 Ne warp, 22 Ne weft, 60 EPI, 40 PPI (yields W = 61.18 g/m², V = 42.64 g/m², Total = 103.81 g/m² ≈ 104 GSM)
    const btnLoadPreset = document.getElementById('btn-load-woven-preset');
    const btnResetWoven = document.getElementById('btn-reset-woven');

    if (btnLoadPreset) {
        btnLoadPreset.addEventListener('click', () => {
            advWarpCount.value = '23';
            advWarpSystem.value = 'Ne';
            advWeftCount.value = '22';
            advWeftSystem.value = 'Ne';
            advEPI.value = '60';
            advPPI.value = '40';
            advWarpCrimp.value = '0';
            advWeftCrimp.value = '0';

            // Optional Swatch preset (10x10 cm, 1.038 g = 103.8 g/m²)
            swatchWeight.value = '1.038';
            swatchWidth.value = '10';
            swatchWidthUnit.value = 'cm';
            swatchLength.value = '10';
            swatchLengthUnit.value = 'cm';

            // Target GSM
            advTargetGSM.value = '104';
            advTargetTol.value = '5';

            updateTexHints();
            runWovenCalculation();
        });
    }

    if (btnResetWoven) {
        btnResetWoven.addEventListener('click', () => {
            if (advWovenForm) advWovenForm.reset();
            updateTexHints();
            clearWovenResults();
        });
    }

    function clearWovenResults() {
        const elEstGSM = document.getElementById('adv-est-gsm-val');
        if (elEstGSM) elEstGSM.innerText = '—';
        const elEstRounded = document.getElementById('adv-est-rounded-hint');
        if (elEstRounded) elEstRounded.innerText = 'GSM = Total fabric weight (g) ÷ sample area (1 m²)';

        const elTotalG = document.getElementById('adv-total-weight-g-val');
        if (elTotalG) elTotalG.innerText = '—';

        const elWarpG = document.getElementById('adv-warp-g-val') || document.getElementById('adv-warp-gsm-val');
        if (elWarpG) elWarpG.innerText = '—';
        const elWarpPct = document.getElementById('adv-warp-pct');
        if (elWarpPct) elWarpPct.innerText = '—%';
        const elWarpDetail = document.getElementById('adv-warp-detail-hint');
        if (elWarpDetail) elWarpDetail.innerText = 'X = (EPI × 39.54² × 453.6) ÷ (840 × 36 × Ne) g';

        const elWeftG = document.getElementById('adv-weft-g-val') || document.getElementById('adv-weft-gsm-val');
        if (elWeftG) elWeftG.innerText = '—';
        const elWeftPct = document.getElementById('adv-weft-pct');
        if (elWeftPct) elWeftPct.innerText = '—%';
        const elWeftDetail = document.getElementById('adv-weft-detail-hint');
        if (elWeftDetail) elWeftDetail.innerText = 'Y = (PPI × 39.54² × 453.6) ÷ (840 × 36 × Ne) g';

        document.getElementById('adv-measured-gsm-val').innerText = 'Not entered';
        document.getElementById('adv-diff-pct-val').innerText = '—';
        document.getElementById('adv-variance-explanation').innerText = 'Enter swatch details on the left to compare physical sample weight against theoretical estimate.';
        if (advTolBox) advTolBox.classList.add('hidden');
        if (wovenErrorAlert) wovenErrorAlert.classList.add('hidden');
    }

    // Core Woven Calculation Function
    function runWovenCalculation() {
        if (!advWarpCount || !advWeftCount || !advEPI || !advPPI) return;

        // Clear previous error
        if (wovenErrorAlert) {
            wovenErrorAlert.innerText = '';
            wovenErrorAlert.classList.add('hidden');
        }

        const warpCountVal = parseFloat(advWarpCount.value);
        const warpSysVal = advWarpSystem.value;
        const weftCountVal = parseFloat(advWeftCount.value);
        const weftSysVal = advWeftSystem.value;

        const epiVal = parseFloat(advEPI.value);
        const ppiVal = parseFloat(advPPI.value);
        const warpCrimpVal = parseFloat(advWarpCrimp.value) || 0;
        const weftCrimpVal = parseFloat(advWeftCrimp.value) || 0;

        // Validation
        const errors = [];
        if (isNaN(warpCountVal) || warpCountVal <= 0) errors.push('Warp Yarn Count (Ne) must be a positive number greater than 0.');
        if (isNaN(weftCountVal) || weftCountVal <= 0) errors.push('Weft Yarn Count (Ne) must be a positive number greater than 0.');
        if (isNaN(epiVal) || epiVal <= 0) errors.push('Warp Thread Density (EPI) must be a positive number greater than 0.');
        if (isNaN(ppiVal) || ppiVal <= 0) errors.push('Weft Thread Density (PPI) must be a positive number greater than 0.');
        if (warpCrimpVal < 0) errors.push('Warp Crimp (%) cannot be negative.');
        if (weftCrimpVal < 0) errors.push('Weft Crimp (%) cannot be negative.');

        if (errors.length > 0) {
            if (wovenErrorAlert) {
                wovenErrorAlert.innerHTML = `<strong>Validation Error:</strong> ${errors.join('<br>')}`;
                wovenErrorAlert.classList.remove('hidden');
                wovenErrorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            return;
        }

        // Convert yarn counts to Ne (English Cotton Count)
        const warpNe = convertAnyToNe(warpCountVal, warpSysVal);
        const weftNe = convertAnyToNe(weftCountVal, weftSysVal);

        if (!warpNe || !weftNe) {
            if (wovenErrorAlert) {
                wovenErrorAlert.innerHTML = '<strong>Error:</strong> Invalid yarn count conversion to Ne.';
                wovenErrorAlert.classList.remove('hidden');
            }
            return;
        }

        // Unit-Correct Yarn Weight Formula (Weights in Grams for a 1 m² sample):
        // Conversion factor from pounds (lb) to grams: 453.6 g/lb (1 lb = 453.6 g)
        // 1 m² = 39.54 in × 39.54 in (with standard weaving allowance)
        // FACTOR = (39.54 × 39.54 × 453.6) ÷ (840 × 36) ≈ 23.451174
        // X = Warp weight (g)
        // Y = Weft weight (g)
        // Total fabric weight (g) = X + Y
        const FACTOR = (39.54 * 39.54 * 453.6) / (840 * 36);

        const X_warpG = (epiVal * FACTOR / warpNe) * (1.0 + (warpCrimpVal / 100.0));
        const Y_weftG = (ppiVal * FACTOR / weftNe) * (1.0 + (weftCrimpVal / 100.0));
        const totalWeightG = X_warpG + Y_weftG;

        // Separate GSM Calculation:
        // GSM = total fabric weight (g) ÷ sample area (m²)
        // For a 1 m² sample (area = 1.00 m²), total weight in grams is numerically equal to GSM:
        const sampleAreaM2 = 1.0;
        const fabricGSM = totalWeightG / sampleAreaM2;

        const warpPct = (X_warpG / totalWeightG) * 100.0;
        const weftPct = (Y_weftG / totalWeightG) * 100.0;

        // Update Results UI
        // 1. GSM Result
        const elEstGSM = document.getElementById('adv-est-gsm-val');
        if (elEstGSM) elEstGSM.innerText = fabricGSM.toFixed(2);
        const elEstHint = document.getElementById('adv-est-rounded-hint');
        if (elEstHint) elEstHint.innerText = `GSM = ${totalWeightG.toFixed(2)} g ÷ 1.00 m² = ${fabricGSM.toFixed(2)} g/m² (≈ ${Math.round(fabricGSM)} GSM)`;

        // 2. Total Fabric Weight (g) = X + Y
        const elTotalG = document.getElementById('adv-total-weight-g-val');
        if (elTotalG) elTotalG.innerText = totalWeightG.toFixed(2);

        // 3. X = Warp weight (g)
        const elWarpG = document.getElementById('adv-warp-g-val') || document.getElementById('adv-warp-gsm-val');
        if (elWarpG) elWarpG.innerText = X_warpG.toFixed(2);
        const elWarpPct = document.getElementById('adv-warp-pct');
        if (elWarpPct) elWarpPct.innerText = `${warpPct.toFixed(1)}%`;
        const elWarpHint = document.getElementById('adv-warp-detail-hint');
        if (elWarpHint) elWarpHint.innerText = `X = ${epiVal} EPI | ${warpNe.toFixed(2)} Ne (${warpCountVal} ${warpSysVal}${warpCrimpVal > 0 ? `, ${warpCrimpVal}% crimp` : ''}) => ${X_warpG.toFixed(2)} g`;

        // 4. Y = Weft weight (g)
        const elWeftG = document.getElementById('adv-weft-g-val') || document.getElementById('adv-weft-gsm-val');
        if (elWeftG) elWeftG.innerText = Y_weftG.toFixed(2);
        const elWeftPct = document.getElementById('adv-weft-pct');
        if (elWeftPct) elWeftPct.innerText = `${weftPct.toFixed(1)}%`;
        const elWeftHint = document.getElementById('adv-weft-detail-hint');
        if (elWeftHint) elWeftHint.innerText = `Y = ${ppiVal} PPI | ${weftNe.toFixed(2)} Ne (${weftCountVal} ${weftSysVal}${weftCrimpVal > 0 ? `, ${weftCrimpVal}% crimp` : ''}) => ${Y_weftG.toFixed(2)} g`;

        // Optional Swatch Mode (ASTM D3776):
        // measured GSM = sample weight in grams × 10,000 ÷ (width in cm × length in cm)
        let measuredGSM = null;
        const sWeight = parseFloat(swatchWeight?.value);
        const sWidth = parseFloat(swatchWidth?.value);
        const sWidthUnit = swatchWidthUnit?.value || 'cm';
        const sLength = parseFloat(swatchLength?.value);
        const sLengthUnit = swatchLengthUnit?.value || 'cm';

        if (sWeight > 0 && sWidth > 0 && sLength > 0) {
            const wCm = toCentimeters(sWidth, sWidthUnit);
            const lCm = toCentimeters(sLength, sLengthUnit);
            const areaCm2 = wCm * lCm;

            if (areaCm2 > 0) {
                measuredGSM = (sWeight * 10000.0) / areaCm2;
                document.getElementById('adv-measured-gsm-val').innerText = `${measuredGSM.toFixed(2)} g/m²`;

                // Calculate Variance
                const diff = fabricGSM - measuredGSM;
                const diffPct = (diff / measuredGSM) * 100.0;
                const sign = diffPct >= 0 ? '+' : '';
                document.getElementById('adv-diff-pct-val').innerText = `${sign}${diffPct.toFixed(2)}% (${Math.abs(diff).toFixed(2)} g/m² diff)`;

                document.getElementById('adv-variance-explanation').innerHTML = `
                    Physical swatch: <strong>${measuredGSM.toFixed(2)} g/m²</strong> (${sWeight}g, ${wCm.toFixed(1)}×${lCm.toFixed(1)} cm).
                    Variance of <strong>${sign}${diffPct.toFixed(2)}%</strong> reflects natural yarn count tolerances, finishing contraction, or chemical finishing add-on.
                `;
            }
        } else {
            document.getElementById('adv-measured-gsm-val').innerText = 'Not entered';
            document.getElementById('adv-diff-pct-val').innerText = '—';
            document.getElementById('adv-variance-explanation').innerText = 'Enter swatch details on the left to compare physical sample weight against theoretical estimate.';
        }

        // Target GSM & Tolerance Evaluation
        const targetVal = parseFloat(advTargetGSM?.value);
        const tolVal = parseFloat(advTargetTol?.value) || 5;

        if (targetVal > 0 && advTolBox && advTolBadge && advTolRangeText) {
            advTolBox.classList.remove('hidden');
            const minAllowed = targetVal * (1.0 - (tolVal / 100.0));
            const maxAllowed = targetVal * (1.0 + (tolVal / 100.0));

            // Evaluate on measured swatch if present, otherwise theoretical estimate
            const evaluatedValue = measuredGSM !== null ? measuredGSM : fabricGSM;
            const evalSource = measuredGSM !== null ? 'Physical Swatch (ASTM D3776)' : 'Mill Formula (X + Y)';

            const isPass = evaluatedValue >= minAllowed && evaluatedValue <= maxAllowed;

            if (isPass) {
                advTolBadge.className = 'tol-badge tol-pass';
                advTolBadge.innerText = `✓ IN SPECIFICATION (±${tolVal}%)`;
            } else {
                advTolBadge.className = 'tol-badge tol-fail';
                const dir = evaluatedValue < minAllowed ? 'BELOW SPEC' : 'ABOVE SPEC';
                advTolBadge.innerText = `✕ ${dir} (±${tolVal}%)`;
            }

            advTolRangeText.innerHTML = `
                Target: <strong>${targetVal.toFixed(1)} g/m²</strong> | Allowed: <strong>${minAllowed.toFixed(1)} – ${maxAllowed.toFixed(1)} g/m²</strong>
                <br><span style="font-size:0.75rem; color:#64748B;">Based on: ${evalSource} (${evaluatedValue.toFixed(2)} g/m²)</span>
            `;
        } else if (advTolBox) {
            advTolBox.classList.add('hidden');
        }

        // Save current woven report state
        window.currentWovenReport = {
            warp: `X = Warp weight: ${X_warpG.toFixed(2)} g (${warpPct.toFixed(1)}%) — ${epiVal} EPI, ${warpNe.toFixed(2)} Ne (${warpCountVal} ${warpSysVal}${warpCrimpVal > 0 ? `, ${warpCrimpVal}% crimp` : ''})`,
            weft: `Y = Weft weight: ${Y_weftG.toFixed(2)} g (${weftPct.toFixed(1)}%) — ${ppiVal} PPI, ${weftNe.toFixed(2)} Ne (${weftCountVal} ${weftSysVal}${weftCrimpVal > 0 ? `, ${weftCrimpVal}% crimp` : ''})`,
            totalGrams: `Total fabric weight (g) = X + Y = ${totalWeightG.toFixed(2)} g`,
            estimated: `${fabricGSM.toFixed(2)} g/m² (≈ ${Math.round(fabricGSM)} GSM)`,
            breakdown: `X: ${X_warpG.toFixed(2)} g + Y: ${Y_weftG.toFixed(2)} g = ${totalWeightG.toFixed(2)} g (GSM: ${fabricGSM.toFixed(2)} g/m²)`,
            measured: measuredGSM !== null ? `${measuredGSM.toFixed(2)} g/m²` : 'Not tested',
            target: targetVal > 0 ? `${targetVal} ±${tolVal}% (${(targetVal * (1 - tolVal / 100)).toFixed(1)} - ${(targetVal * (1 + tolVal / 100)).toFixed(1)} g/m²)` : 'None specified'
        };
    }

    if (advWovenForm) {
        advWovenForm.addEventListener('submit', (e) => {
            e.preventDefault();
            runWovenCalculation();
        });
    }

    // Print Woven Report Action
    const btnPrintWoven = document.getElementById('btn-print-woven-report');
    if (btnPrintWoven) {
        btnPrintWoven.addEventListener('click', () => {
            if (!window.currentWovenReport) {
                runWovenCalculation();
            }

            if (window.currentWovenReport) {
                const rep = window.currentWovenReport;
                const content = `
                    <div class="report-content">
                        <h2>Woven Fabric GSM Technical Specification Report</h2>
                        <p style="color:#666; margin-bottom: 1.5rem;">Unit-Correct Mill Formula: X = (EPI × 39.54² × 453.6) ÷ (840 × 36 × Warp Ne) & ASTM D3776</p>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
                            <tbody>
                                <tr style="background:#f8fafc;">
                                    <th style="border: 1px solid #ddd; padding: 10px; text-align: left; width: 40%;">Specification Parameter</th>
                                    <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Values & Calculated Data</th>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 10px;"><strong>X = Warp Weight (g)</strong></td>
                                    <td style="border: 1px solid #ddd; padding: 10px;">${rep.warp}</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 10px;"><strong>Y = Weft Weight (g)</strong></td>
                                    <td style="border: 1px solid #ddd; padding: 10px;">${rep.weft}</td>
                                </tr>
                                <tr style="background:#f1f5f9;">
                                    <td style="border: 1px solid #ddd; padding: 10px;"><strong>Total Fabric Weight (g) = X + Y</strong></td>
                                    <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; color:#0F172A;">${rep.totalGrams}</td>
                                </tr>
                                <tr style="background:#eef2ff;">
                                    <td style="border: 1px solid #ddd; padding: 10px;"><strong>Fabric GSM (Weight per Unit Area)</strong></td>
                                    <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold; font-size: 1.1rem; color:#4F46E5;">${rep.estimated}</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 10px;"><strong>Physical Measured Swatch (ASTM D3776)</strong></td>
                                    <td style="border: 1px solid #ddd; padding: 10px;">${rep.measured}</td>
                                </tr>
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 10px;"><strong>Target & Tolerance Limit</strong></td>
                                    <td style="border: 1px solid #ddd; padding: 10px;">${rep.target}</td>
                                </tr>
                            </tbody>
                        </table>

                        <p><strong>Standard Verification Note:</strong> Fabric weight (GSM = g/m²) is derived from Total Fabric Weight (g) = X + Y divided by sample area (1 m²). Yarn weights X and Y are calculated in grams using the conversion constants 39.54 in/m, 36 in/yd, 840 yd/hank, and 453.6 g/lb. ASTM D3776 swatch weighing confirms actual mass per unit area.</p>
                        <p><em>Disclaimer: Fabric GSM indicates mass per unit area and does not solely determine overall fabric tensile strength, drape, or durability.</em></p>
                    </div>
                `;
                document.getElementById('report-content').innerHTML = content;
                window.print();
            }
        });
    }
});
