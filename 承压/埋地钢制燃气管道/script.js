/**
 * 埋地钢制燃气管道风险评估系统 - 主要JavaScript文件
 * 基于rbi.css样式结构实现所有模块的交互功能和评分计算
 */

// 埋地钢制燃气管道风险评估系统
class RBIAssessmentSystem {
    constructor() {
        this.currentModule = 'third_party';
        this.scores = {
            third_party: {},
            corrosion: {},
            equipment: {},
            safety: {},
            consequence: {}
        };
        
        // 初始化标志，防止初始化阶段触发互斥逻辑
        this.isInitializing = false;
        this.init();
    }

    // 创建钢管最大泄漏量计算器弹窗（完全内嵌版本）
    openLeakageCalculator(targetInput) {
        // 移除已存在的计算器
        const existing = document.getElementById('leakage-calculator-modal');
        if (existing) existing.remove();

        // 创建计算器模态框
        const modal = document.createElement('div');
        modal.id = 'leakage-calculator-modal';
        modal.className = 'leakage-calculator-modal';
        
        modal.innerHTML = `
            <div class="leakage-calculator-content" style="display: flex; flex-direction: column; height: 85vh; max-height: 90vh; min-height: 500px;">
                <div class="calculator-header">
                    <h3>钢管最大泄漏量计算器</h3>
                    <button class="close-btn" onclick="this.closest('.leakage-calculator-modal').remove()">×</button>
                </div>
                <div class="leakage-calc-container" style="flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;">
                    
                    <div class="leakage-calc-input-group">
                        <label for="leakage-pipe-pressure">P(管道内介质压力，MPa):</label>
                        <input type="number" id="leakage-pipe-pressure" step="0.01" min="0.01" placeholder="请输入管道内介质压力">
                    </div>
                    
                    <div class="leakage-calc-input-group">
                        <label for="leakage-medium-temperature">C(介质温度，°C):</label>
                        <input type="number" id="leakage-medium-temperature" step="0.1" placeholder="请输入介质温度(摄氏度)">
                        <span id="leakage-temperature-display" style="color: #2563eb; font-size: 12px; margin-top: 4px; display: none;">开尔文温度: <span id="leakage-kelvin-value">0</span> K</span>
                    </div>
                    
                    <div class="leakage-calc-input-group">
                        <label for="leakage-pipe-outer-diameter">De(管道外径，mm):</label>
                        <input type="number" id="leakage-pipe-outer-diameter" step="0.01" min="0.01" placeholder="请输入管道外径">
                    </div>
                    
                    <div class="leakage-calc-input-group">
                        <label for="leakage-wall-thickness">T（管道壁厚，mm）:</label>
                        <input type="number" id="leakage-wall-thickness" step="0.01" min="0.01" placeholder="请输入管道壁厚">
                        <span id="leakage-wall-thickness-error" style="color:#ef4444; font-size:12px; display:none; margin-left:8px;">壁厚必须大于0</span>
                    </div>
                    
                    <div class="leakage-calc-input-group">
                        <label>t(泄露时间，s): <span id="leakage-leak-time-display" style="color: #2563eb; font-weight: 600; margin-left: 8px;">1200</span> （默认取较大规模泄漏）</label>
                        <label>m(泄漏量调整值，%): <span id="leakage-final-adjustment-display" style="color: #2563eb; font-weight: 600; margin-left: 8px;">0%</span></label>
                        <div style="margin-top: 8px;">
                            <div style="margin-bottom: 12px;">
                                <label style="font-size: 14px; color: #2563eb; font-weight: 600;">按照监测与切断系统调整泄漏量:</label>
                                <div style="margin-top: 8px;">
                                    <label for="leakage-monitoring-system" style="font-size: 14px; color: #495057;">监测系统类型:</label>
                                    <select id="leakage-monitoring-system" style="width: 100%; margin-top: 4px;">
                                        <option value="A">A级 - 监测关键参数的变化从而间接监测介质流失的专用设备</option>
                                        <option value="B">B级 - 直接监测介质实际流失的灵敏的探测器</option>
                                        <option value="C">C级 - 目测,摄像头等</option>
                                    </select>
                                    <div style="margin-top: 8px;">
                                        <label for="leakage-cutoff-system" style="font-size: 14px; color: #495057;">切断系统类型:</label>
                                        <select id="leakage-cutoff-system" style="width: 100%; margin-top: 4px;">
                                            <option value="A">A级 - 自动切断装置</option>
                                            <option value="B">B级 - 远程人为切断装置</option>
                                            <option value="C">C级 - 人工切断阀</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div style="margin-bottom: 12px;">
                                <label style="font-size: 14px; color: #2563eb; font-weight: 600;">按照消防系统调整泄漏量:</label>
                                <div style="margin-top: 8px;">
                                    <label for="leakage-fire-system" style="font-size: 14px; color: #495057;">消防系统:</label>
                                    <select id="leakage-fire-system" style="width: 100%; margin-top: 4px;">
                                        <option value="emergency">紧急泄放系统,且装备有A级或B级切断系统</option>
                                        <option value="sprinkler">消防水喷淋和监测系统</option>
                                        <option value="foam">泡沫喷射系统</option>
                                        <option value="water-monitor">消防水监测系统</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style="font-size: 14px; color: #2563eb; font-weight: 600;">按照应急预案调整泄漏量:</label>
                                <div style="margin-top: 8px;">
                                    <label for="leakage-emergency-plan" style="font-size: 14px; color: #495057;">应急预案:</label>
                                    <select id="leakage-emergency-plan" style="width: 100%; margin-top: 4px;">
                                        <option value="complete">应急预案完整可靠,经常演习</option>
                                        <option value="incomplete">应急预案不完整,或缺乏演习</option>
                                        <option value="none">无应急预案</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="leakage-calc-result" id="leakage-calc-result" style="display:none;">
                        <div class="leakage-calc-result-grid">
                            <div class="leakage-calc-result-item">
                                <span class="leakage-calc-result-label">Q（可能的介质最大泄漏量，kg）:</span>
                                <span id="leakage-max-leakage" class="leakage-calc-result-value">0</span>
                            </div>
                            <div class="leakage-calc-result-item">
                                <span class="leakage-calc-result-label">泄漏量评分:</span>
                                <span id="leakage-score-result" class="leakage-calc-result-value">0</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                        <button id="leakage-apply-result-btn" class="leakage-calc-btn">应用结果到E.3评分</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        // 初始化计算器功能
        this.initLeakageCalculator(modal, targetInput);
    }

    // 初始化钢管泄漏量计算器的所有功能
    initLeakageCalculator(modal, targetInput) {
        let lastCalculatedLeakage;

        // 工具函数
        function enforcePositive(input) {
            if (!input) return;
            var raw = String(input.value || '');
            if (raw === '' || raw === '0' || raw === '0.') return;
            if (raw.startsWith('-')) { input.value = raw.replace('-', ''); return; }
            var v = parseFloat(raw);
            if (isNaN(v) || v < 0) { input.value = ''; }
        }

        function limitTwoDecimals(input) {
            if (!input || typeof input.value !== 'string') return;
            if (input.value.includes('.') && input.value.split('.')[1].length > 2) {
                input.value = input.value.slice(0, input.value.indexOf('.') + 3);
            }
        }

        function convertTemperature(input) {
            limitTwoDecimals(input);
            const temperatureDisplay = modal.querySelector('#leakage-temperature-display');
            const kelvinValue = modal.querySelector('#leakage-kelvin-value');
            if (!input.value || input.value === '') { 
                temperatureDisplay.style.display = 'none'; 
                return; 
            }
            const celsius = parseFloat(input.value);
            if (isNaN(celsius)) { 
                temperatureDisplay.style.display = 'none'; 
                return; 
            }
            const kelvin = celsius + 273.15;
            kelvinValue.textContent = kelvin.toFixed(2);
            temperatureDisplay.style.display = 'block';
        }

        function validateWallThickness() {
            const el = modal.querySelector('#leakage-wall-thickness');
            const err = modal.querySelector('#leakage-wall-thickness-error');
            if (!el || !err) return;
            const v = parseFloat(el.value);
            if (isNaN(v)) { err.style.display = 'none'; return; }
            if (v <= 0) { err.style.display = 'inline'; } else { err.style.display = 'none'; }
        }

        function updateAdjustment() {
            const monitoring = modal.querySelector('#leakage-monitoring-system').value;
            const cutoff = modal.querySelector('#leakage-cutoff-system').value;
            const fire = modal.querySelector('#leakage-fire-system').value;
            const emergency = modal.querySelector('#leakage-emergency-plan').value;
            
            let leakTime = 0;
            if (monitoring === 'A' && cutoff === 'A') leakTime = 300; else leakTime = 1200;
            modal.querySelector('#leakage-leak-time-display').textContent = leakTime;
            
            let monCut = 0;
            if (monitoring === 'A' && cutoff === 'A') monCut = 25;
            else if (monitoring === 'A' && cutoff === 'B') monCut = 20;
            else if (monitoring === 'B' && cutoff === 'C') monCut = 15;
            else if (monitoring === 'A' && cutoff === 'C') monCut = 10;
            
            let fireAdj = 0;
            if (fire === 'emergency') fireAdj = 25;
            else if (fire === 'sprinkler') fireAdj = 20;
            else if (fire === 'foam') fireAdj = 15;
            else if (fire === 'water-monitor') fireAdj = 5;
            
            let emerAdj = 0;
            if (emergency === 'complete') emerAdj = 20;
            else if (emergency === 'incomplete') emerAdj = 10;
            
            modal.querySelector('#leakage-final-adjustment-display').textContent = Math.max(monCut, fireAdj, emerAdj) + '%';
            
            // 自动重新计算
            autoCalculate();
        }

        function autoCalculate() {
            const pipePressure = parseFloat(modal.querySelector('#leakage-pipe-pressure').value);
            const celsius = parseFloat(modal.querySelector('#leakage-medium-temperature').value);
            const De = parseFloat(modal.querySelector('#leakage-pipe-outer-diameter').value);
            const wallThickness = parseFloat(modal.querySelector('#leakage-wall-thickness').value);
            
            // 检查所有必要的输入是否都已填写且有效
            if (!pipePressure || pipePressure <= 0 || 
                isNaN(celsius) || 
                !De || De <= 0 || 
                !wallThickness || wallThickness <= 0) {
                // 如果参数不完整，隐藏结果
                modal.querySelector('#leakage-calc-result').style.display = 'none';
                return;
            }
            
            // 参数完整，执行计算
            calculate(true);
        }

        function calculate(isAutoCalc = false) {
            const pipePressure = parseFloat(modal.querySelector('#leakage-pipe-pressure').value);
            const celsius = parseFloat(modal.querySelector('#leakage-medium-temperature').value);
            const De = parseFloat(modal.querySelector('#leakage-pipe-outer-diameter').value);
            const wallThickness = parseFloat(modal.querySelector('#leakage-wall-thickness').value);
            const monitoring = modal.querySelector('#leakage-monitoring-system').value;
            const cutoff = modal.querySelector('#leakage-cutoff-system').value;
            const fire = modal.querySelector('#leakage-fire-system').value;
            const emergency = modal.querySelector('#leakage-emergency-plan').value;
            
            // 如果不是自动计算，显示验证消息
            if (!isAutoCalc) {
                if (!pipePressure || pipePressure <= 0) { alert('请输入有效的压力值'); return; }
                if (isNaN(celsius)) { alert('请输入介质温度'); return; }
                if (!De || De <= 0) { alert('请选择或输入有效外径'); return; }
                if (!wallThickness || wallThickness <= 0) { alert('请输入有效的管道壁厚'); return; }
            } else {
                // 自动计算时静默检查，不符合条件直接返回
                if (!pipePressure || pipePressure <= 0 || isNaN(celsius) || !De || De <= 0 || !wallThickness || wallThickness <= 0) { 
                    return; 
                }
            }
            
            // 固定参数值
            const F2 = 20; // M 介质分子量 g/mol
            const E2 = 1.31; // K 恒压比热与恒积比热的比值
            const D2 = 0.183848188; // Ptrans 临界压力 MPa
            const Pa = 0.1; // Pa 大气压力 MPa
            const G2 = 0.85; // Cd 泄露系数
            const K2 = 32.2; // gc 转变系数
            const J2 = 8.314; // R' 气体常数
            
            const T = wallThickness;
            const I2 = celsius + 273.15; // T 介质温度 K
            const P2 = (monitoring === 'A' && cutoff === 'A') ? 300 : 1200; // t 泄露时间 s
            
            let monCut = 0;
            if (monitoring === 'A' && cutoff === 'A') monCut = 25;
            else if (monitoring === 'A' && cutoff === 'B') monCut = 20;
            else if (monitoring === 'B' && cutoff === 'C') monCut = 15;
            else if (monitoring === 'A' && cutoff === 'C') monCut = 10;
            
            let fireAdj = 0;
            if (fire === 'emergency') fireAdj = 25;
            else if (fire === 'sprinkler') fireAdj = 20;
            else if (fire === 'foam') fireAdj = 15;
            else if (fire === 'water-monitor') fireAdj = 5;
            
            let emerAdj = 0;
            if (emergency === 'complete') emerAdj = 20;
            else if (emergency === 'incomplete') emerAdj = 10;
            else if (emergency === 'none') emerAdj = 0;
            
            const R2 = Math.max(monCut, fireAdj, emerAdj); // m 泄漏量调整值 %
            
            // 计算 Sk（泄露面积，mm2）
            const N2 = De - 2 * T;
            const W1 = 3.14 * (N2/2) * (N2/2);
            const H2 = W1 > 129717 ? 12917 : W1; // Sk 泄露面积
            
            const B2 = pipePressure; // P 管道内介质压力 MPa
            const W2 = 0.0056 * G2 * H2 * B2;
            
            let O2; // 泄漏率 kg/s
            if (B2 < D2) { // 亚临界流
                const X3 = Pa / B2;
                const Y3 = 1 - Math.pow(X3, (E2-1)/E2);
                const W3 = Math.pow(X3, 2/E2) * E2 * K2 * 2 * E2 / (J2 * I2 * (E2-1));
                O2 = W2 * Math.sqrt(W3 * Y3); // U2
            } else { // 临界流
                const X2 = E2 * F2 * K2 / (J2 * I2);
                const Y2 = Math.pow(2/(E2+1), (E2+1)/(E2-1));
                O2 = W2 * Math.sqrt(X2 * Y2); // V2
            }
            
            const Q2 = O2 * P2; // 总泄漏量 kg
            const U5 = Q2 * (1 - R2/100); // 调整后的泄漏量 kg
            
            // 计算泄漏量评分 V5
            let V5; // 泄漏量评分
            if (U5 > 450000) {
                V5 = 20; // G8
            } else if (U5 > 45000) {
                V5 = 16; // F8
            } else if (U5 > 4500) {
                V5 = 12; // E8
            } else if (U5 > 450) {
                V5 = 8; // D8
            } else {
                V5 = 1; // C8
            }
            
            lastCalculatedLeakage = U5;
            modal.querySelector('#leakage-max-leakage').textContent = U5.toFixed(4);
            modal.querySelector('#leakage-score-result').textContent = V5;
            modal.querySelector('#leakage-calc-result').style.display = 'block';
        }


        // 绑定事件监听器
        
        modal.querySelector('#leakage-medium-temperature').addEventListener('input', function() { 
            convertTemperature(this); 
            autoCalculate(); 
        });
        
        modal.querySelector('#leakage-pipe-pressure').addEventListener('input', function() { 
            enforcePositive(this); 
            limitTwoDecimals(this); 
            autoCalculate(); 
        });
        
        modal.querySelector('#leakage-wall-thickness').addEventListener('input', function() { 
            enforcePositive(this); 
            limitTwoDecimals(this); 
            validateWallThickness(); 
            autoCalculate(); 
        });
        
        modal.querySelector('#leakage-pipe-outer-diameter').addEventListener('input', function() { 
            enforcePositive(this); 
            limitTwoDecimals(this); 
            autoCalculate(); 
        });
        
        ['leakage-monitoring-system', 'leakage-cutoff-system', 'leakage-fire-system', 'leakage-emergency-plan'].forEach(function(id) {
            const el = modal.querySelector('#' + id);
            if (el) el.addEventListener('change', updateAdjustment);
        });
        
        modal.querySelector('#leakage-apply-result-btn').addEventListener('click', function() {
            if (typeof lastCalculatedLeakage !== 'undefined') {
                const leakageValue = parseFloat(modal.querySelector('#leakage-max-leakage').textContent);
                if (!isNaN(leakageValue)) {
                    // 根据泄漏量选择对应的下拉框选项
                    let selectedOption;
                    if (leakageValue <= 450) {
                        selectedOption = 'leakage1_1';
                    } else if (leakageValue <= 4500) {
                        selectedOption = 'leakage1_8';
                    } else if (leakageValue <= 45000) {
                        selectedOption = 'leakage1_12';
                    } else if (leakageValue <= 450000) {
                        selectedOption = 'leakage1_16';
                    } else {
                        selectedOption = 'leakage1_20';
                    }
                    
                    // 应用到下拉框
                    targetInput.value = selectedOption;
                    targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    // 直接关闭计算器
                    setTimeout(() => {
                        modal.remove();
                    }, 100);
                } else {
                    alert('计算结果无效，请重新计算');
                }
            } else {
                calculate(); // 如果还没有计算过，则执行一次计算
            }
        });
        
        // 初始化调整值显示
        updateAdjustment();
    }



    createSafetyMarginCalculator() {
        const existing = document.getElementById('safety-margin-calculator');
        if (existing) existing.remove();

        const calculator = document.createElement('div');
        calculator.id = 'safety-margin-calculator';
        calculator.className = 'depth-calculator';
        calculator.style.cssText = 'display: flex; flex-direction: column; height: 85vh; max-height: 90vh; min-height: 500px;';
        calculator.innerHTML = `
            <div class="calculator-header">
                <h3>D.5.2.5 附加安全裕度计算器</h3>
                <button class="close-btn" onclick="this.closest('.depth-calculator').remove()">×</button>
            </div>
            <div class="calculator-content" style="flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;">
                <div class="input-group">
                    <label for="t3-input">t3（管道实测最小壁厚，mm）</label>
                    <input type="number" id="t3-input" class="option-input" step="any" placeholder="请输入t3">
                </div>
                <div class="input-group">
                    <label for="t1-input">t1（管道所需最小壁厚，取设计计算值与相应规范要求的较大值，mm）</label>
                    <input type="number" id="t1-input" class="option-input" step="any" placeholder="请输入t1">
                </div>
                <div class="result-group">
                    <label>计算结果</label>
                    <div class="result-display" id="sm-calculation-result">—</div>
                </div>
                <div class="button-group">
                    <button class="apply-btn" id="sm-apply-btn" disabled>应用结果</button>
                </div>
            </div>
        `;

        document.body.appendChild(calculator);
        setTimeout(() => calculator.classList.add('show'), 10);

        const t3 = calculator.querySelector('#t3-input');
        const t1 = calculator.querySelector('#t1-input');
        const applyBtn = calculator.querySelector('#sm-apply-btn');
        const resultEl = calculator.querySelector('#sm-calculation-result');

        const compute = () => {
            const vT3 = parseFloat(t3.value);
            const vT1 = parseFloat(t1.value);
            if (isNaN(vT3) || isNaN(vT1) || vT3 < 0 || vT1 <= 0) {
                resultEl.textContent = '请输入有效数值';
                resultEl.classList.remove('success');
                applyBtn.disabled = true;
                return null;
            }
            // 计算逻辑（正式）：
            // D2 = 2.5 * (A2/B2 - 1) = 2.5 * (t3/t1 - 1)
            // 附加安全裕度 = IFS(D2 < 0, 'S=100', D2 > 2, 2, 0<=D2<=2, D2)
            const D2 = 2.5 * (vT3 / vT1 - 1);
            let score;
            let s100 = false;
            if (D2 < 0) {
                s100 = true; // S=100 情况
                score = 0;   // 得分不计入，但显示S=100提示
            } else if (D2 > 2) {
                score = 2;
            } else {
                score = D2;
            }
            const rounded = Math.round(score * 100) / 100;
            const t3s = (Math.round(vT3 * 1000) / 1000).toString();
            const t1s = (Math.round(vT1 * 1000) / 1000).toString();
            const formulaHtml = `
                <div style="text-align: left; line-height: 1.5;">
                    <div><strong>最终得分: ${rounded}分${s100 ? '（S=100）' : ''}</strong></div>
                    <div style=\"font-size: 12px; color: #065f46; margin-top: 8px;\">计算公式: D2 = 2.5 × (t3/t1 - 1) = 2.5 × (${t3s}/${t1s} - 1)；附加安全裕度 = IFS(D2<0, 'S=100', D2>2, 2, 0≤D2≤2, D2) = ${s100 ? 'S=100' : rounded}</div>
                </div>`;
            resultEl.innerHTML = formulaHtml;
            resultEl.classList.add('success');
            applyBtn.disabled = false;
            return s100 ? -1 : rounded; // 返回-1表示S=100，用于上层处理
        };

        // 自动计算
        ;[t3, t1].forEach(el => el.addEventListener('input', compute));
        compute();

        applyBtn.addEventListener('click', () => {
            const score = compute();
            if (score == null) return;
            const input = document.querySelector('#safety-safetyMargin1');
            if (input) {
                if (score === -1) {
                    // S=100 情况：在输入框中显示提示文本
                    input.type = 'text';
                    input.value = '附加安全裕度小于0，S=100';
                    input.dataset.s100 = 'true';
                } else {
                    // 恢复为数值输入并写回分数
                    input.type = 'number';
                    input.value = score;
                    input.dataset.s100 = '';
                }
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
                try { this.updateSectionScores('safety'); } catch (e) {}
            }
            calculator.remove();
        });
    }
    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.loadModule('third_party');
        this.setupCalculateButton();
        

        
        // 页面加载完成后，延迟更新所有模块的分数显示
        setTimeout(() => {
            // 先确保所有模块都被渲染
            this.ensureAllModulesRendered();
            // 然后更新分数显示
            setTimeout(() => {
                this.updateAllModuleScores();
                // 特别处理大气腐蚀的默认分数显示
                this.updateAtmosphericCorrosionScores();
                // 初始化埋深评分输入框状态
                this.initializeDepthInputs();
                // 延迟强制更新所有分数，确保所有元素都已渲染完成
                setTimeout(() => {
                    console.log('系统初始化完成，开始强制更新所有分数...');
                    this.forceUpdateAllScores();
                    // 确保天然气选项卡中的固定选项正确显示默认值
                    this.ensureNaturalGasTabDefaults();
                    
                    // 额外延迟确保所有模块都已完全渲染
                    setTimeout(() => {
                        this.ensureNaturalGasTabDefaults();
                    }, 200);
                    
                    // 不再在页面初始化时设置失效后果模块的默认值
                    // 改为在用户实际访问失效后果模块时设置
                    console.log('页面初始化完成，失效后果模块默认值将在用户访问时设置');
                }, 300);
            }, 100);
        }, 200);
    }

    setupNavigation() {
        const navMenu = document.querySelector('.nav-menu');
        if (!navMenu) return;

        const navList = navMenu.querySelector('.nav-list');
        const modules = [
            { id: 'third_party', name: '第三方破坏', icon: 'fas fa-users-cog' },
            { id: 'corrosion', name: '腐蚀', icon: 'fas fa-vial' },
            { id: 'equipment', name: '设备及操作', icon: 'fas fa-cogs' },
            { id: 'safety', name: '管道本质安全', icon: 'fas fa-shield-alt' },
            { id: 'consequence', name: '失效后果', icon: 'fas fa-exclamation-triangle' }
        ];

        modules.forEach(module => {
            const navItem = document.createElement('li');
            navItem.className = 'nav-item';
            navItem.innerHTML = `
                <a href="#${module.id}" class="nav-link" data-module="${module.id}">
                    <div class="nav-link-content">
                        <i class="${module.icon}"></i>
                        <span>${module.name}</span>
                        <div class="nav-score" data-module="${module.id}">得分：—</div>
                    </div>
                </a>
            `;
            navList.appendChild(navItem);
        });
        
        // 初始化所有模块的分数显示
        this.updateAllModuleScores();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-link')) {
                e.preventDefault();
                const link = e.target.closest('.nav-link');
                const moduleId = link.dataset.module;
                this.loadModule(moduleId);
                this.updateNavigation(moduleId);
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('option-select')) {
                this.handleScoreChange(e.target);
            } else if (e.target.classList.contains('option-input')) {
                this.handleInputChange(e.target);
            }
        });

        document.addEventListener('click', (e) => {
            // 优先处理评分项重置按钮点击事件
            const resetBtn = e.target.closest('.section-reset-btn');
            if (resetBtn) {
                e.preventDefault(); // 阻止默认行为
                e.stopPropagation(); // 阻止事件冒泡到section-title
                const sectionId = resetBtn.dataset.sectionId;
                const moduleId = resetBtn.dataset.moduleId;
                this.resetSectionScores(sectionId, moduleId);
                return; // 如果处理了重置按钮，直接返回，不处理其他事件
            }
            
            // 处理section标题的折叠/展开
            const titleEl = e.target.closest('.section-title');
            if (titleEl) {
                this.toggleSection(titleEl);
            }
        });
    }

    updateNavigation(activeModuleId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.module === activeModuleId) {
                link.classList.add('active');
            }
        });
    }

    loadModule(moduleId) {
        this.currentModule = moduleId;
        this.hideAllModules();
        this.showModule(moduleId);
        this.updateNavigation(moduleId);
        
        // 如果是第三方破坏模块，确保埋深输入框状态正确
        if (moduleId === 'third_party') {
            setTimeout(() => {
                this.initializeDepthInputs();
            }, 100);
        }
        
        // 如果是失效后果模块，确保天然气选项卡的默认值正确设置
        if (moduleId === 'consequence') {
            setTimeout(() => {
                this.ensureNaturalGasTabDefaults();
            }, 200);
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    hideAllModules() {
        document.querySelectorAll('.content-module').forEach(module => {
            module.classList.remove('active');
        });
    }

    showModule(moduleId) {
        const module = document.getElementById(`module-${moduleId}`);
        if (module) {
            module.classList.add('active');
            this.renderModuleContent(moduleId);
        }
    }

    renderModuleContent(moduleId) {
        const module = document.getElementById(`module-${moduleId}`);
        if (!module) return;

        const content = module.querySelector('.module-content');
        if (!content) return;

        // 检查是否已经渲染过内容
        if (content.querySelector('.scoring-system')) {
            return; // 如果已经渲染过，直接返回，不重新渲染
        }

        switch (moduleId) {
            case 'third_party':
                this.renderThirdPartyModule(content);
                break;
            case 'corrosion':
                this.renderCorrosionModule(content);
                break;
            case 'equipment':
                this.renderEquipmentModule(content);
                break;
            case 'safety':
                this.renderSafetyModule(content);
                break;
            case 'consequence':
                this.renderFailureConsequenceModule(content);
                // 失效后果模块渲染完成后，确保天然气选项卡的默认值正确设置
                setTimeout(() => {
                    this.ensureNaturalGasTabDefaults();
                }, 100);
                break;
        }
    }

    // 渲染第三方破坏模块 - 完整评分数据
    renderThirdPartyModule(container) {
        const scoringData = [
            {
                id: "D2232",
                title: "D.2.3.2地面活动水平的评分",
                maxScore: 30,
                subitems: [
                    {
                        id: "D22322",
                        title: "D.2.3.2.2人口密度的评分",
                        maxScore: 5,
                        items: [
                            {
                                id: "pop1",
                                title: "人口密度评分",
                                options: [
                                    { id: "pop1a", text: "2km长度范围内，管道区段两侧各200m的范围内，地上4层及以上建筑物普遍", score: 0 },
                                    { id: "pop1b", text: "2km长度范围内，管道区段与人员聚集的室内外场所的距离<30m", score: 0 },
                                    { id: "pop1c", text: "2km长度范围内，管道区段两侧各200m的范围内，存在地上4层及以上建筑物", score: 1 },
                                    { id: "pop1d", text: "2km长度范围内，管道区段与人员聚集的室内外场所的距离∈[30m，90m]", score: 1 },
                                    { id: "pop1e", text: "2km长度范围内，管道区段两侧各200m的范围内，供人居住的单元数>80，但无地上4层及以上的建筑物", score: 2 },
                                    { id: "pop1f", text: "2km长度范围内，管道区段与人员聚集的室内外场所的距离>90m", score: 3 },
                                    { id: "pop1g", text: "2km长度范围内，管道区段两侧各200m的范围内，供人居住的单元数∈[12，80)", score: 3 },
                                    { id: "pop1h", text: "2km长度范围内，管道区段两侧各200m的范围内，供人居住的单元数<12", score: 5 }
                                ],
                                selected: "pop1h"
                            }
                        ]
                    },
                    {
                        id: "D22323",
                        title: "D.2.3.2.3地面活动频繁程度的评分",
                        maxScore: 25,
                        items: [
                            {
                                id: "act1",
                                title: "建设活动频繁程度",
                                options: [
                                    { id: "act1a", text: "管道区段位于矿藏开发及重工业生产地区", score: 0 },
                                    { id: "act1b", text: "管道区段位于在建的经济技术开发区", score: 1 },
                                    { id: "act1c", text: "管道区段位于经常对周围地下设施进行维护的地区", score: 3 },
                                    { id: "act1d", text: "管道区段位于附近有清理水沟，修围墙等维护活动的地区", score: 5 },
                                    { id: "act1e", text: "管道区段位于没有建设活动的地区", score: 7 }
                                ],
                                selected: "act1e"
                            },
                            {
                                id: "act2",
                                title: "对建设活动施工单位的技术交底",
                                options: [
                                    { id: "act2a", text: "未交底", score: 0 },
                                    { id: "act2b", text: "进行图纸交底", score: 4 },
                                    { id: "act2c", text: "进行现场交底", score: 7 }
                                ],
                                selected: "act2c"
                            },
                            {
                                id: "act3",
                                title: "交通繁忙程度",
                                options: [
                                    { id: "act3a", text: "管道区段附近有铁路、公路交通主干线", score: 0 },
                                    { id: "act3b", text: "管道区段附近有公路交通干线", score: 2 },
                                    { id: "act3c", text: "管道区段附近有公路交通线", score: 5 },
                                    { id: "act3d", text: "管道区段附近几乎没有车辆通行", score: 8 }
                                ],
                                selected: "act3d"
                            },
                            {
                                id: "act4",
                                title: "地质勘探活动",
                                options: [
                                    { id: "act4a", text: "管道区段附近有地质勘探活动", score: 0 },
                                    { id: "act4b", text: "管道区段附近无地质勘探活动", score: 3 }
                                ],
                                selected: "act4b"
                            }
                        ]
                    }
                ]
            },
            {
                id: "D2233",
                title: "D.2.3.3埋深的评分",
                maxScore: 8,
                type: "conditional",
                items: [
                    {
                        id: "depth_type_selector",
                        title: "请选择管道类型",
                        options: [
                            { id: "", text: "请选择" },
                            { id: "non_underwater", text: "非水下穿越管道埋深的评分", score: null },
                            { id: "underwater", text: "水下穿越管道埋深的评分", score: null }
                        ],
                        selected: "",
                        conditional: true
                    }
                ],
                conditionalContent: {
                    non_underwater: {
                        id: "D22332",
                        title: "D.2.3.3.2非水下穿越管道埋深的评分",
                        items: [
                            {
                                id: "depth1a",
                                title: "跨越段或露管段",
                                options: [
                                    { id: "depth1a1", text: "跨越段或露管段", score: 0 }
                                ],
                                selected: "depth1a1"
                            },
                            {
                                id: "depth1b",
                                title: "埋地段",
                                inputType: "number",
                                minValue: 0,
                                maxValue: 8,
                                step: 0.1,
                                placeholder: "请输入0-8之间的数值，根据实际埋深评分",
                                defaultValue: 0,
                                showCalculator: true
                            }
                        ]
                    },
                    underwater: {
                        id: "D22333",
                        title: "D.2.3.3.3水下穿越管道埋深的评分",
                        subitems: [
                            {
                                id: "depth2",
                                title: "可通航河道河底土壤表面(河床表面)与航船底面距离或未通航河道的水深",
                                maxScore: 2,
                                items: [
                                    {
                                        id: "depth2a",
                                        title: "通航距离或深度",
                                        options: [
                                            { id: "depth2a1", text: "上述距离或深度∈[0m～0.5m)", score: 0 },
                                            { id: "depth2a2", text: "上述距离或深度∈[0.5m～1.0m)", score: 0.5 },
                                            { id: "depth2a3", text: "上述距离或深度∈[1.0m～1.5m)", score: 1 },
                                            { id: "depth2a4", text: "上述距离或深度∈[1.5m～2.0m)", score: 1.5 },
                                            { id: "depth2a5", text: "上述距离或深度≥2.0m", score: 2 }
                                        ],
                                        selected: "depth2a5"
                                    }
                                ]
                            },
                            {
                                id: "depth3",
                                title: "在河底的土壤埋深",
                                maxScore: 4,
                                items: [
                                    {
                                        id: "depth3a",
                                        title: "土壤埋深",
                                        options: [
                                            { id: "depth3a1", text: "埋深∈[0m～0.5m)", score: 0 },
                                            { id: "depth3a2", text: "埋深∈[0.5m～1.0m)", score: 1 },
                                            { id: "depth3a3", text: "埋深∈[1.0m～1.5m)", score: 2 },
                                            { id: "depth3a4", text: "埋深∈[1.5m～2.0m)", score: 3 },
                                            { id: "depth3a5", text: "埋深≥2.0m", score: 4 }
                                        ],
                                        selected: "depth3a5"
                                    }
                                ]
                            },
                            {
                                id: "depth4",
                                title: "保护措施",
                                maxScore: 2,
                                items: [
                                    {
                                        id: "depth4a",
                                        title: "保护措施",
                                        options: [
                                            { id: "depth4a1", text: "无保护措施", score: 0 },
                                            { id: "depth4a2", text: "采用石笼稳管、加设固定墩等稳管措施", score: 1 },
                                            { id: "depth4a3", text: "采用30mm以上水泥保护层或其他能达到同样加固效果的措施", score: 2 }
                                        ],
                                        selected: "depth4a3"
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                id: "D2234",
                title: "D.2.3.4地面装置及其保护措施的评分",
                maxScore: 11,
                subitems: [
                    {
                        id: "D22342",
                        title: "D.2.3.4.2地面装置与公路的距离的评分",
                        maxScore: 3,
                        items: [
                            {
                                id: "device1",
                                title: "地面装置与公路距离",
                                options: [
                                    { id: "device1a", text: "地面装置与公路的距离不大于15m", score: 0 },
                                    { id: "device1b", text: "地面装置与公路的距离大于15m", score: 3 },
                                    { id: "device1c", text: "无地面装置", score: 3 }
                                ],
                                selected: "device1c"
                            }
                        ]
                    },
                    {
                        id: "D22343",
                        title: "D.2.3.4.3地面装置的围栏的评分",
                        maxScore: 2,
                        items: [
                            {
                                id: "device2",
                                title: "地面装置围栏",
                                options: [
                                    { id: "device2a", text: "地面装置没有保护围栏或者粗壮的树将装置与路隔离", score: 0 },
                                    { id: "device2b", text: "地面装置设有保护围栏或者粗壮的树将装置与路隔离", score: 2 },
                                    { id: "device2c", text: "无地面装置", score: 2 }
                                ],
                                selected: "device2c"
                            }
                        ]
                    },
                    {
                        id: "D22344",
                        title: "D.2.3.4.4地面装置的沟渠的评分",
                        maxScore: 2,
                        items: [
                            {
                                id: "device3",
                                title: "地面装置沟渠",
                                options: [
                                    { id: "device3a", text: "地面装置与道路之间无不低于1.2m深的沟渠", score: 0 },
                                    { id: "device3b", text: "地面装置与道路之间有不低于1.2m深的沟渠", score: 2 },
                                    { id: "device3c", text: "无地面装置", score: 2 }
                                ],
                                selected: "device3c"
                            }
                        ]
                    },
                    {
                        id: "D22345",
                        title: "D.2.3.4.5地面装置的警示标志符号的评分",
                        maxScore: 1,
                        items: [
                            {
                                id: "device4",
                                title: "警示标志符号",
                                options: [
                                    { id: "device4a", text: "地面装置无警示标志符号", score: 0 },
                                    { id: "device4b", text: "地面装置有警示标志符号", score: 1 },
                                    { id: "device4c", text: "无地面装置", score: 1 }
                                ],
                                selected: "device4c"
                            }
                        ]
                    }
                ]
            },
            {
                id: "D2235",
                title: "D.2.3.5占压的评分",
                maxScore: 6,
                items: [
                    {
                        id: "occupy1",
                        title: "管道占压情况",
                                                        options: [
                                    { id: "occupy1a", text: "管道区段上占压现象严重(5处以上)", score: 0 },
                                    { id: "occupy1b", text: "管道区段上存在占压管道的现象(1～4处)", score: 3 },
                                    { id: "occupy1c", text: "管道区段上无占压现象", score: 6 }
                                ],
                                selected: "occupy1c"
                    }
                ]
            },
            {
                id: "D2236",
                title: "D.2.3.6管道标识的评分",
                maxScore: 8,
                items: [
                    {
                        id: "marker1",
                        title: "管道标识情况",
                                                        options: [
                                    { id: "marker1a", text: "无地面标志", score: 0 },
                                    { id: "marker1b", text: "部分地面标志损坏", score: 3 },
                                    { id: "marker1c", text: "地面标志完好，但有些地面标志不显著", score: 6 },
                                    { id: "marker1d", text: "地面标志完好、清晰可见", score: 8 },
                                    { id: "marker1e", text: "不需要地面标志", score: 8 }
                                ],
                                selected: "marker1e"
                    }
                ]
            },
            {
                id: "D2237",
                title: "D.2.3.7巡线的评分",
                maxScore: 25,
                subitems: [
                    {
                        id: "D22372",
                        title: "D.2.3.7.2巡线频率的评分",
                        maxScore: 12,
                        items: [
                            {
                                id: "patrol1",
                                title: "巡线频率",
                                options: [
                                    { id: "patrol1a", text: "从来不巡线", score: 0 },
                                    { id: "patrol1b", text: "巡线频率∈(0，每月1次]", score: 2 },
                                    { id: "patrol1c", text: "巡线频率∈(每月1次，每月2次]", score: 4 },
                                    { id: "patrol1d", text: "巡线频率∈(每月2次，每周1次]", score: 6 },
                                    { id: "patrol1e", text: "巡线频率∈(每周1次，每两日1次]", score: 8 },
                                    { id: "patrol1f", text: "巡线频率∈(每两日1次，每日1次]", score: 10 },
                                    { id: "patrol1g", text: "聘有随时报告员", score: 12 }
                                ],
                                selected: "patrol1g"
                            }
                        ]
                    },
                    {
                        id: "D22373",
                        title: "D.2.3.7.3巡线方式的评分",
                        maxScore: 8,
                        items: [
                            {
                                id: "patrol2",
                                title: "巡线方式",
                                options: [
                                    { id: "patrol2a", text: "只巡检乘车方便的管段", score: 0 },
                                    { id: "patrol2b", text: "只巡检建设、挖掘频繁的管段", score: 4 },
                                    { id: "patrol2c", text: "沿管道区段逐步巡线", score: 8 }
                                ],
                                selected: "patrol2c"
                            }
                        ]
                    },
                    {
                        id: "D22374",
                        title: "D.2.3.7.4巡线人员的能力的评分",
                        maxScore: 5,
                        items: [
                            {
                                id: "patrol3",
                                title: "巡线人员能力",
                                options: [
                                    { id: "patrol3a", text: "巡线人员不能胜任巡线工作", score: 0 },
                                    { id: "patrol3b", text: "巡线人员能基本胜任巡线工作", score: 3 },
                                    { id: "patrol3c", text: "巡线人员能胜任巡线工作", score: 5 }
                                ],
                                selected: "patrol3c"
                            }
                        ]
                    }
                ]
            },
            {
                id: "D2238",
                title: "D.2.3.8公众教育的评分",
                maxScore: 15,
                items: [
                    {
                        id: "edu1",
                        title: "公众教育情况",
                                                        options: [
                                    { id: "edu1a", text: "与公安部门、居民委员会等部门没有联系，并且未进行宣传工作", score: 0 },
                                    { id: "edu1b", text: "与公安部门，居民委员会等部门没有联系，但进行了一定程度的宣传工作", score: 3 },
                                    { id: "edu1c", text: "与公安部门、居民委员会等部门没有联系，但进行了大量的宣传工作", score: 7 },
                                    { id: "edu1d", text: "与公安部门、居民委员会等部门有一定的联系，但未进行宣传工作", score: 7 },
                                    { id: "edu1e", text: "与公安部门、居民委员会等部门有一定的联系，并且进行了一定程度的宣传工作", score: 9 },
                                    { id: "edu1f", text: "与公安部门、居民委员会等部门有一定的联系，并且进行了大量的宣传工作", score: 11 },
                                    { id: "edu1g", text: "与公安部门、居民委员会等部门密切联系，但未进行宣传工作", score: 11 },
                                    { id: "edu1h", text: "与公安部门、居民委员会等部门密切联系，并且进行了一定程度的宣传工作", score: 13 },
                                    { id: "edu1i", text: "与公安部门、居民委员会等部门密切联系，并且进行了大量的宣传工作", score: 15 }
                                ],
                                selected: "edu1i"
                    }
                ]
            }
        ];

        this.renderScoringSystem(container, scoringData, 'third_party');
    }
    
    // 获取第三方破坏模块的评分数据
    getThirdPartyScoringData() {
        return [
            {
                id: "D2232",
                title: "D.2.3.2地面活动水平的评分",
                maxScore: 30,
                subitems: [
                    {
                        id: "D22322",
                        title: "D.2.3.2.2人口密度的评分",
                        maxScore: 5,
                        items: [
                            {
                                id: "pop1",
                                title: "人口密度评分",
                                options: [
                                    { id: "pop1a", text: "2km长度范围内，管道区段两侧各200m的范围内，地上4层及以上建筑物普遍", score: 0 },
                                    { id: "pop1b", text: "2km长度范围内，管道区段与人员聚集的室内外场所的距离<30m", score: 0 },
                                    { id: "pop1c", text: "2km长度范围内，管道区段两侧各200m的范围内，存在地上4层及以上建筑物", score: 1 },
                                    { id: "pop1d", text: "2km长度范围内，管道区段与人员聚集的室内外场所的距离∈[30m，90m]", score: 1 },
                                    { id: "pop1e", text: "2km长度范围内，管道区段两侧各200m的范围内，供人居住的单元数>80，但无地上4层及以上的建筑物", score: 2 },
                                    { id: "pop1f", text: "2km长度范围内，管道区段与人员聚集的室内外场所的距离>90m", score: 3 },
                                    { id: "pop1g", text: "2km长度范围内，管道区段两侧各200m的范围内，供人居住的单元数∈[12，80)", score: 3 },
                                    { id: "pop1h", text: "2km长度范围内，管道区段两侧各200m的范围内，供人居住的单元数<12", score: 5 }
                                ],
                                selected: "pop1h"
                            }
                        ]
                    },
                    {
                        id: "D22323",
                        title: "D.2.3.2.3地面活动频繁程度的评分",
                        maxScore: 25,
                        items: [
                            {
                                id: "act1",
                                title: "建设活动频繁程度",
                                options: [
                                    { id: "act1a", text: "管道区段位于矿藏开发及重工业生产地区", score: 0 },
                                    { id: "act1b", text: "管道区段位于在建的经济技术开发区", score: 1 },
                                    { id: "act1c", text: "管道区段位于经常对周围地下设施进行维护的地区", score: 3 },
                                    { id: "act1d", text: "管道区段位于附近有清理水沟，修围墙等维护活动的地区", score: 5 },
                                    { id: "act1e", text: "管道区段位于没有建设活动的地区", score: 7 }
                                ],
                                selected: "act1e"
                            },
                            {
                                id: "act2",
                                title: "对建设活动施工单位的技术交底",
                                options: [
                                    { id: "act2a", text: "未交底", score: 0 },
                                    { id: "act2b", text: "进行图纸交底", score: 4 },
                                    { id: "act2c", text: "进行现场交底", score: 7 }
                                ],
                                selected: "act2c"
                            },
                            {
                                id: "act3",
                                title: "交通繁忙程度",
                                options: [
                                    { id: "act3a", text: "管道区段附近有铁路、公路交通主干线", score: 0 },
                                    { id: "act1b", text: "管道区段附近有公路交通干线", score: 2 },
                                    { id: "act3c", text: "管道区段附近有公路交通线", score: 5 },
                                    { id: "act3d", text: "管道区段附近几乎没有车辆通行", score: 8 }
                                ],
                                selected: "act3d"
                            },
                            {
                                id: "act4",
                                title: "地质勘探活动",
                                options: [
                                    { id: "act4a", text: "管道区段附近有地质勘探活动", score: 0 },
                                    { id: "act4b", text: "管道区段附近无地质勘探活动", score: 3 }
                                ],
                                selected: "act4b"
                            }
                        ]
                    }
                ]
            },
            {
                id: "D2233",
                title: "D.2.3.3埋深的评分",
                maxScore: 8,
                type: "tabs",
                tabs: [
                    {
                        id: "tab1",
                        title: "非水下穿越管道埋深",
                        icon: "🌊",
                        active: false,
                        content: {
                            id: "D22332",
                            title: "D.2.3.3.2非水下穿越管道埋深的评分",
                            maxScore: 8,
                            items: [
                                {
                                    id: "depth1a",
                                    title: "跨越段或露管段",
                                    options: [
                                        { id: "depth1a1", text: "跨越段或露管段", score: 0 }
                                    ],
                                    selected: "depth1a1"
                                },
                                {
                                    id: "depth1b",
                                    title: "埋地段",
                                    inputType: "number",
                                    minValue: 0,
                                    maxValue: 8,
                                    step: 0.1,
                                    placeholder: "请输入0-8之间的数值，根据实际埋深评分",
                                    defaultValue: 0,
                                showCalculator: true
                                }
                            ]
                        }
                    },
                    {
                        id: "tab2",
                        title: "水下穿越管道埋深",
                        icon: "🌊",
                        active: true,
                        content: {
                            id: "D22333",
                            title: "D.2.3.3.3水下穿越管道埋深的评分",
                            maxScore: 8,
                            subitems: [
                                {
                                    id: "depth2",
                                    title: "可通航河道河底土壤表面(河床表面)与航船底面距离或未通航河道的水深",
                                    maxScore: 2,
                                    items: [
                                        {
                                            id: "depth2a",
                                            title: "通航距离或深度",
                                            options: [
                                                { id: "depth2a1", text: "上述距离或深度∈[0m～0.5m)", score: 0 },
                                                { id: "depth2a2", text: "上述距离或深度∈[0.5m～1.0m)", score: 0.5 },
                                                { id: "depth2a3", text: "上述距离或深度∈[1.0m～1.5m)", score: 1 },
                                                { id: "depth2a4", text: "上述距离或深度∈[1.5m～2.0m)", score: 1.5 },
                                                { id: "depth2a5", text: "上述距离或深度≥2.0m", score: 2 }
                                            ],
                                            selected: "depth2a5"
                                        }
                                    ]
                                },
                                {
                                    id: "depth3",
                                    title: "在河底的土壤埋深",
                                    maxScore: 4,
                                    items: [
                                        {
                                            id: "depth3a",
                                            title: "土壤埋深",
                                            options: [
                                                { id: "depth3a1", text: "埋深∈[0m～0.5m)", score: 0 },
                                                { id: "depth3a2", text: "埋深∈[0.5m～1.0m)", score: 1 },
                                                { id: "depth3a3", text: "埋深∈[1.0m～1.5m)", score: 2 },
                                                { id: "depth3a4", text: "埋深∈[1.5m～2.0m)", score: 3 },
                                                { id: "depth3a5", text: "埋深≥2.0m", score: 4 }
                                            ],
                                            selected: "depth3a5"
                                        }
                                    ]
                                },
                                {
                                    id: "depth4",
                                    title: "保护措施",
                                    maxScore: 2,
                                    items: [
                                        {
                                            id: "depth4a",
                                            title: "保护措施",
                                            options: [
                                                { id: "depth4a1", text: "无保护措施", score: 0 },
                                                { id: "depth4a2", text: "采用石笼稳管、加设固定墩等稳管措施", score: 1 },
                                                { id: "depth4a3", text: "采用30mm以上水泥保护层或其他能达到同样加固效果的措施", score: 2 }
                                            ],
                                            selected: "depth4a4"
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            },
            {
                id: "D2234",
                title: "D.2.3.4地面装置及其保护措施的评分",
                maxScore: 11,
                subitems: [
                    {
                        id: "D22342",
                        title: "D.2.3.4.2地面装置与公路的距离的评分",
                        maxScore: 3,
                        items: [
                            {
                                id: "device1",
                                title: "地面装置与公路距离",
                                options: [
                                    { id: "device1a", text: "地面装置与公路的距离不大于15m", score: 0 },
                                    { id: "device1b", text: "地面装置与公路的距离大于15m", score: 3 },
                                    { id: "device1c", text: "无地面装置", score: 3 }
                                ],
                                selected: "device1c"
                            }
                        ]
                    },
                    {
                        id: "D22343",
                        title: "D.2.3.4.3地面装置的围栏的评分",
                        maxScore: 2,
                        items: [
                            {
                                id: "device2",
                                title: "地面装置围栏",
                                options: [
                                    { id: "device2a", text: "地面装置没有保护围栏或者粗壮的树将装置与路隔离", score: 0 },
                                    { id: "device2b", text: "地面装置设有保护围栏或者粗壮的树将装置与路隔离", score: 2 },
                                    { id: "device2c", text: "无地面装置", score: 2 }
                                ],
                                selected: "device2c"
                            }
                        ]
                    },
                    {
                        id: "D22344",
                        title: "D.2.3.4.4地面装置的沟渠的评分",
                        maxScore: 2,
                        items: [
                            {
                                id: "device3",
                                title: "地面装置沟渠",
                                options: [
                                    { id: "device3a", text: "地面装置与公路之间无不低于1.2m深的沟渠", score: 0 },
                                    { id: "device3b", text: "地面装置与公路之间有不低于1.2m深的沟渠", score: 2 },
                                    { id: "device3c", text: "无地面装置", score: 2 }
                                ],
                                selected: "device3c"
                            }
                        ]
                    },
                    {
                        id: "D22345",
                        title: "D.2.3.4.5地面装置的警示标志符号的评分",
                        maxScore: 1,
                                items: [
                            {
                                id: "device4",
                                title: "警示标志符号",
                                options: [
                                    { id: "device4a", text: "地面装置没有警示标志符号", score: 0 },
                                    { id: "device4a1", text: "地面装置有警示标志符号", score: 1 },
                                    { id: "device4a2", text: "无地面装置", score: 1 }
                                ],
                                selected: "device4a2"
                            }
                        ]
                    }
                ]
            },
            {
                id: "D2235",
                title: "D.2.3.5占压的评分",
                maxScore: 6,
                items: [
                    {
                        id: "occupy1",
                        title: "管道占压情况",
                        options: [
                            { id: "occupy1a", text: "管道区段上占压现象严重(5处以上)", score: 0 },
                            { id: "occupy1b", text: "管道区段上存在占压管道的现象(1～4处)", score:3 },
                            { id: "occupy1c", text: "管道区段上无占压现象", score: 6 }
                        ],
                        selected: "occupy1c"
                    }
                ]
            },
            {
                id: "D2236",
                title: "D.2.3.6管道标识的评分",
                maxScore: 8,
                items: [
                    {
                        id: "marker1",
                        title: "管道标识情况",
                        options: [
                            { id: "device1a", text: "无地面标志", score: 0 },
                            { id: "device1b", text: "部分地面标志损坏", score: 3 },
                            { id: "device1c", text: "地面标志完好，但有些地面标志不显著", score: 6 },
                            { id: "device1d", text: "地面标志完好、清晰可见", score: 8 },
                            { id: "device1e", text: "不需要地面标志", score: 8 }
                        ],
                        selected: "device1e"
                    }
                ]
            },
            {
                id: "D2237",
                title: "D.2.3.7巡线的评分",
                maxScore: 25,
                subitems: [
                    {
                        id: "D22372",
                        title: "D.2.3.7.2巡线频率的评分",
                        maxScore: 12,
                        items: [
                            {
                                id: "patrol1",
                                title: "巡线频率",
                                options: [
                                    { id: "patrol1a", text: "从来不巡线", score: 0 },
                                    { id: "patrol1b", text: "巡线频率∈(0，每月1次]", score: 2 },
                                    { id: "patrol1c", text: "巡线频率∈(每月1次，每月2次]", score: 4 },
                                    { id: "patrol1d", text: "巡线频率∈(每月2次，每周1次]", score: 6 },
                                    { id: "patrol1e", text: "巡线频率∈(每周1次，每两日1次]", score: 8 },
                                    { id: "patrol1f", text: "巡线频率∈(每两日1次，每日1次]", score: 10 },
                                    { id: "patrol1g", text: "聘有随时报告员", score: 12 }
                                ],
                                selected: "patrol1g"
                            }
                        ]
                    },
                    {
                        id: "D22373",
                        title: "D.2.3.7.3巡线方式的评分",
                        maxScore: 8,
                        items: [
                            {
                                id: "patrol2",
                                title: "巡线方式",
                                options: [
                                    { id: "patrol2a", text: "只巡检乘车方便的管段", score: 0 },
                                    { id: "patrol2b", text: "只巡检建设、挖掘频繁的管段", score: 4 },
                                    { title: "沿管道区段逐步巡线", score: 8 }
                                ],
                                selected: "patrol2c"
                            }
                        ]
                    },
                    {
                        id: "D22374",
                        title: "D.2.3.7.4巡线人员的能力的评分",
                        maxScore: 5,
                        items: [
                            {
                                id: "patrol3",
                                title: "巡线人员能力",
                                options: [
                                    { id: "patrol3a", text: "巡线人员不能胜任巡线工作", score: 0 },
                                    { id: "patrol3b", text: "巡线人员能基本胜任巡线工作", score: 3 },
                                    { id: "patrol3c", text: "巡线人员能胜任巡线工作", score: 5 }
                                ],
                                selected: "patrol3c"
                            }
                        ]
                    }
                ]
            },
            {
                id: "D2238",
                title: "D.2.3.8公众教育的评分",
                maxScore: 15,
                items: [
                    {
                        id: "edu1",
                        title: "公众教育情况",
                        options: [
                            { id: "edu1a", text: "与公安部门、居民委员会等部门没有联系，并且未进行宣传工作", score: 0 },
                            { id: "edu1b", text: "与公安部门，居民委员会等部门没有联系，但进行了一定程度的宣传工作", score: 3 },
                            { id: "edu1c", text: "与公安部门、居民委员会等部门没有联系，但进行了大量的宣传工作", score: 7 },
                            { id: "edu1d", text: "与公安部门、居民委员会等部门有一定的联系，但未进行宣传工作", score: 7 },
                            { id: "edu1e", text: "与公安部门、居民委员会等部门有一定的联系，并且进行了一定程度的宣传工作", score: 9 },
                            { id: "edu1f", text: "与公安部门、居民委员会等部门有一定的联系，并且进行了大量的宣传工作", score: 11 },
                            { id: "edu1g", text: "与公安部门、居民委员会等部门密切联系，但未进行宣传工作", score: 11 },
                            { id: "edu1h", text: "与公安部门、居民委员会等部门密切联系，并且进行了一定程度的宣传工作", score: 13 },
                            { id: "edu1i", text: "与公安部门、居民委员会等部门密切联系，并且进行了大量的宣传工作", score: 15 }
                        ],
                        selected: "edu1i"
                    }
                ]
            }
        ];
    }
    // 渲染腐蚀模块 - 大气腐蚀改为双选项卡（D.3.2.2 / D.3.2.3）
    renderCorrosionModule(container) {
        const scoringData = [
            {
                id: "D32",
                title: "D.3.2大气腐蚀的评分",
                maxScore: 10,
                collapsed: false,
                type: "conditional",
                items: [
                    {
                        id: "atmospheric_type_selector",
                        title: "请选择管道段类型",
                        options: [
                            { id: "", text: "请选择" },
                            { id: "underground", text: "埋地段的大气腐蚀评分" },
                            { id: "crossing", text: "跨越段的大气腐蚀评分" }
                        ],
                        selected: "",
                        conditional: true
                    }
                ],
                conditionalContent: {
                    underground: {
                        id: "D322",
                        title: "D.3.2.2埋地段的大气腐蚀的评分",
                        items: [
                            {
                                id: "atm1",
                                title: "埋地段的大气腐蚀评分",
                                options: [
                                    { id: "atm1a", text: "埋地段的大气腐蚀的得分为10分", score: 10 },
                                    { id: "atm1b", text: "不参与评分", score: 0 }
                                ],
                                selected: "atm1a"
                            }
                        ]
                    },
                    crossing: {
                        id: "D323",
                        title: "D.3.2.3跨越段的大气腐蚀的评分",
                        subitems: [
                            {
                                id: "D3232",
                                title: "D.3.2.3.2跨越段的位置特点的评分",
                                maxScore: 2,
                                collapsed: false,
                                items: [
                                    {
                                        id: "pos1",
                                        title: "跨越段的位置特点",
                                        noHeader: true,
                                        options: [
                                            { id: "pos1a", text: "位于水与空气的界面", score: 0 },
                                            { id: "pos1b", text: "位于土壤与空气界面", score: 1 },
                                            { id: "pos1c", text: "位于空气中", score: 2 }
                                        ],
                                        selected: "pos1c"
                                    }
                                ]
                            },
                            {
                                id: "D3233",
                                title: "D.3.2.3.3跨越段的结构特点的评分",
                                maxScore: 1,
                                collapsed: false,
                                items: [
                                    {
                                        id: "struct1",
                                        title: "跨越段的结构特点",
                                        noHeader: true,
                                        options: [
                                            { id: "struct1a", text: "加装套管", score: 0 },
                                            { id: "struct1b", text: "存在支撑或吊架", score: 0.5 },
                                            { id: "struct1c", text: "无上述情况", score: 1 }
                                        ],
                                        selected: "struct1c"
                                    }
                                ]
                            },
                            {
                                id: "D3234",
                                title: "D.3.2.3.4大气腐蚀性的评分",
                                maxScore: 3,
                                collapsed: false,
                                items: [
                                    {
                                        id: "corrosion1",
                                        title: "大气腐蚀性",
                                        noHeader: true,
                                        options: [
                                            { id: "corrosion1a", text: "未进行大气腐蚀性调查", score: 0 },
                                            { id: "corrosion1b", text: "海洋气候，并且含化学品", score: 0 },
                                            { id: "corrosion1c", text: "工业大气或一般大气，含化学品，并且湿度高", score: 1 },
                                            { id: "corrosion1d", text: "海洋气候并且不含化学品", score: 1.5 },
                                            { id: "corrosion1e", text: "工业大气或一般大气，不含化学品，并且湿度高、温度高", score: 2 },
                                            { id: "corrosion1f", text: "工业大气或一般大气，含化学品，并且湿度低", score: 2.5 },
                                            { id: "corrosion1g", text: "工业大气或一般大气，不含化学品，并且湿度低、温度低", score: 3 }
                                        ],
                                        selected: "corrosion1g"
                                    }
                                ]
                            },
                            {
                                id: "D3235",
                                title: "D.3.2.3.5大气腐蚀防腐层的评分",
                                maxScore: 4,
                                collapsed: false,
                                subitems: [
                                    {
                                        id: "applicability",
                                        title: "a) 大气腐蚀防腐层的适用性",
                                        maxScore: 1,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "app1",
                                                title: "防腐层适用性",
                                                noHeader: true,
                                                options: [
                                                    { id: "app1a", text: "无大气腐蚀防腐层", score: 0 },
                                                    { id: "app1b", text: "大气腐蚀防腐层不适合管道区段所处环境", score: 0 },
                                                    { id: "app1c", text: "大气腐蚀防腐层不是专门为管道区段所处环境设计的", score: 0.5 },
                                                    { id: "app1d", text: "大气腐蚀防腐层是适应管道区段所处环境的防腐层", score: 1 }
                                                ],
                                                selected: "app1d"
                                            }
                                        ]
                                    },
                                    {
                                        id: "quality",
                                        title: "b) 大气腐蚀防腐层的施工质量",
                                        maxScore: 1,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "quality1",
                                                title: "施工质量",
                                                noHeader: true,
                                                options: [
                                                    { id: "quality1a", text: "无大气腐蚀防腐层", score: 0 },
                                                    { id: "quality1b", text: "施工步骤疏漏，没有进行环境控制", score: 0 },
                                                    { id: "quality1c", text: "施工步骤齐全，但操作不规范", score: 0.5 },
                                                    { id: "quality1d", text: "施工步骤齐全，操作较规范，但没有正规的质量控制程序", score: 0.8 },
                                                    { id: "quality1e", text: "有详细的规范说明，采用适当的质量控制系统", score: 1 }
                                                ],
                                                selected: "quality1e"
                                            }
                                        ]
                                    },
                                    {
                                        id: "inspection",
                                        title: "c) 大气腐蚀防腐层的日常检查",
                                        maxScore: 1,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "inspection1",
                                                title: "日常检查",
                                                noHeader: true,
                                                options: [
                                                    { id: "inspection1a", text: "无大气腐蚀防腐层", score: 0 },
                                                    { id: "inspection1b", text: "未检查大气腐蚀防腐层", score: 0 },
                                                    { id: "inspection1c", text: "很少检查，偶尔查看常出问题的地方", score: 0.5 },
                                                    { id: "inspection1d", text: "检查不正规，检查人员未经专门培训或检查时间间隔过长", score: 0.8 },
                                                    { id: "inspection1e", text: "进行正规彻底的检查，检查人员经专门培训，检查时间间隔合理", score: 1 }
                                                ],
                                                selected: "inspection1e"
                                            }
                                        ]
                                    },
                                    {
                                        id: "repair",
                                        title: "d) 大气腐蚀防腐层的修补更换",
                                        maxScore: 1,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "repair1",
                                                title: "修补更换",
                                                noHeader: true,
                                                options: [
                                                    { id: "repair1a", text: "无大气腐蚀防腐层", score: 0 },
                                                    { id: "repair1b", text: "不修补、更换损坏的大气腐蚀防腐层", score: 0 },
                                                    { id: "repair1c", text: "不坚持报告和修复缺陷", score: 0.5 },
                                                    { id: "repair1d", text: "不正式报告缺陷，仅在方便的时候才进行修复", score: 0.8 },
                                                    { id: "repair1e", text: "立即报告缺陷，并有文件记录安排修复时间，按照时间安排和规范进行修复", score: 1 }
                                                ],
                                                selected: "repair1e"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                id: "D33",
                title: "D.3.3内腐蚀的评分",
                maxScore: 11,
                collapsed: false,
                subitems: [
                    {
                        id: "D336",
                        title: "D.3.3.6输送天然气、液化气介质的城市燃气管道内腐蚀的评分",
                        maxScore: 11,
                        collapsed: false,
                        subitems: [
                            {
                                id: "D3362",
                                title: "D.3.3.6.2介质腐蚀性的评分",
                                maxScore: 5,
                                collapsed: false,
                                subitems: [
                                    {
                                        id: "water",
                                        title: "a) 含水量",
                                        maxScore: 2,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "water1",
                                                title: "含水量",
                                                noHeader: true,
                                                options: [
                                                    { id: "water1a", text: "有凝析水", score: 0 },
                                                    { id: "water1b", text: "运行过程中有可能产生凝析水", score: 0 },
                                                    { id: "water1c", text: "无凝析水", score: 2 }
                                                ],
                                                selected: "water1c"
                                            }
                                        ]
                                    },
                                    {
                                        id: "co2",
                                        title: "b) 二氧化碳含量",
                                        maxScore: 1,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "co21",
                                                title: "二氧化碳含量",
                                                noHeader: true,
                                                options: [
                                                    { id: "co21a", text: "二氧化碳分压>0.21mPa", score: 0 },
                                                    { id: "co21b", text: "二氧化碳分压∈[0.021mPa，0.21mPa]", score: 0.5 },
                                                    { id: "co21c", text: "二氧化碳分压<0.021mPa", score: 1 }
                                                ],
                                                selected: "co21c"
                                            }
                                        ]
                                    },
                                    {
                                        id: "h2s",
                                        title: "c) 硫化氢含量",
                                        maxScore: 1,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "h2s1",
                                                title: "硫化氢含量",
                                                noHeader: true,
                                                options: [
                                                    { id: "h2s1a", text: "硫化氢含量>20mg/m3", score: 0 },
                                                    { id: "h2s1b", text: "硫化氢含量≤20mg/m3", score: 1 }
                                                ],
                                                selected: "h2s1b"
                                            }
                                        ]
                                    },
                                    {
                                        id: "velocity",
                                        title: "d) 介质流速",
                                        maxScore: 1,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "velocity1",
                                                title: "介质流速",
                                                noHeader: true,
                                                options: [
                                                    { id: "velocity1a", text: "介质流速<3m/s", score: 0 },
                                                    { id: "velocity1b", text: "介质流速≥3m/s", score: 1 }
                                                ],
                                                selected: "velocity1b"
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                id: "D3363",
                                title: "D.3.3.6.3气质监测的评分",
                                maxScore: 5,
                                collapsed: false,
                                items: [
                                    {
                                        id: "monitor1",
                                        title: "气质监测",
                                        noHeader: true,
                                        options: [
                                            { id: "monitor1a", text: "未进行气质监测", score: 0 },
                                            { id: "monitor1b", text: "气质监测周期过长，不满足实际需要", score: 1 },
                                            { id: "monitor1c", text: "气质监测周期基本满足实际需要", score: 3 },
                                            { id: "monitor1d", text: "气质监测周期满足实际需要", score: 5 },
                                            { id: "monitor1e", text: "不需要进行气质监测", score: 5 }
                                        ],
                                        selected: "monitor1e"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: "D34",
                title: "D.3.4土壤腐蚀的评分",
                maxScore: 79,
                collapsed: false,
                subitems: [
                    {
                        id: "D344",
                        title: "D.3.4.4输送天然气、液化气介质的城市燃气管道土壤腐蚀的评分",
                        maxScore: 79,
                        collapsed: false,
                        subitems: [
                            {
                                id: "D3442",
                                title: "D.3.4.4.2环境腐蚀性调查的评分",
                                maxScore: 12,
                                collapsed: false,
                                subitems: [
                                    {
                                        id: "resistivity",
                                        title: "a) 土壤电阻率",
                                        maxScore: 6,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "resistivity1",
                                                title: "土壤电阻率",
                                                noHeader: true,
                                                options: [
                                                    { id: "resistivity1a", text: "未进行土壤电阻率测量", score: 0 },
                                                    { id: "resistivity1b", text: "土壤电阻率<20 Ω.m，则为0分", score: 0 },
                                                    { id: "resistivity1c", text: "土壤电阻率∈[20Ω.m，50 Ω.m]", score: 3 },
                                                    { id: "resistivity1d", text: "土壤电阻率>50Ω.m", score: 6 }
                                                ],
                                                selected: "resistivity1d"
                                            }
                                        ]
                                    },
                                    {
                                        id: "dc_interference",
                                        title: "b) 直流杂散电流干扰其排流措施",
                                        maxScore: 4,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "dc_interference1",
                                                title: "直流杂散电流干扰",
                                                noHeader: true,
                                                options: [
                                                    { id: "dc_interference1a", text: "直流杂散电流干扰程度大，并且未设置排流装置", score: 0 },
                                                    { id: "dc_interference1b", text: "直流杂散电流干扰程度大，并且设置的排流装置不能完全满足排流的需要", score: 1 },
                                                    { id: "dc_interference1c", text: "直流杂散电流干扰程度中或小，并且未设置排流装置", score: 1 },
                                                    { id: "dc_interference1d", text: "直流杂散电流干扰程度中或小，并且设置的排流装置不能完全满足排流的需要", score: 2 },
                                                    { id: "dc_interference1e", text: "设置的排流装置能满足排流的需要", score: 4 },
                                                    { id: "dc_interference1f", text: "不存在直流杂散电流干扰", score: 4 }
                                                ],
                                                selected: "dc_interference1f"
                                            }
                                        ]
                                    },
                                    {
                                        id: "ac_interference",
                                        title: "c) 交流杂散电流干扰",
                                        maxScore: 2,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "ac_interference1",
                                                title: "交流杂散电流干扰",
                                                noHeader: true,
                                                options: [
                                                    { id: "ac_interference1a", text: "存在交流杂散电流干扰", score: 0 },
                                                    { id: "ac_interference1b", text: "不存在交流杂散电流干扰", score: 2 }
                                                ],
                                                selected: "ac_interference1b"
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                id: "D3443",
                                title: "D.3.4.4.3防腐设计的评分",
                                maxScore: 10,
                                collapsed: false,
                                subitems: [
                                    {
                                        id: "design_qualification",
                                        title: "a) 防腐设计单位的资质",
                                        maxScore: 2,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "qualification1",
                                                title: "设计单位资质",
                                                noHeader: true,
                                                options: [
                                                    { id: "qualification1a", text: "防腐设计单位不具备相应资质", score: 0 },
                                                    { id: "qualification1b", text: "防腐设计单位具备相应资质", score: 2 }
                                                ],
                                                selected: "qualification1b"
                                            }
                                        ]
                                    },
                                    {
                                        id: "design_standard",
                                        title: "b) 防腐设计标准规范的选用",
                                        maxScore: 2,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "standard1",
                                                title: "设计标准规范",
                                                noHeader: true,
                                                options: [
                                                    { id: "standard1a", text: "管道防腐设计未按标准规范设计或采用当时已经作废的设计标准规范", score: 0 },
                                                    { id: "standard1b", text: "管道防腐设计采用当时有效的旧版本管道设计标准规范", score: 1 },
                                                    { id: "standard1c", text: "管道防腐设计采用现行标准规范", score: 2 }
                                                ],
                                                selected: "standard1c"
                                            }
                                        ]
                                    },
                                    {
                                        id: "design_applicability",
                                        title: "c) 防腐设计的适用性",
                                        maxScore: 6,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "applicability1",
                                                title: "设计适用性",
                                                noHeader: true,
                                                options: [
                                                    { id: "applicability1a", text: "外防腐层和/或阴极保护系统的设计不符合防腐设计标准规范要求", score: 0 },
                                                    { id: "applicability1b", text: "外防腐层和/或阴极保护系统的设计基本符合防腐设计标准规范要求", score: 4 },
                                                    { id: "applicability1c", text: "外防腐层和/或阴极保护系统的设计符合防腐设计标准规范要求", score: 6 }
                                                ],
                                                selected: "applicability1c"
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                id: "D3444",
                                title: "D.3.4.4.4外防腐层的评分",
                                maxScore: 37,
                                collapsed: false,
                                subitems: [
                                    {
                                        id: "coating_type",
                                        title: "a) 外防腐层类型",
                                        maxScore: 3,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "type1",
                                                title: "防腐层类型",
                                                noHeader: true,
                                                options: [
                                                    { id: "type1a", text: "无外防腐层", score: 0 },
                                                    { id: "type1b", text: "防锈油漆", score: 1 },
                                                    { id: "type1c", text: "高密度聚乙烯", score: 1.5 },
                                                    { id: "type1d", text: "沥青加玻璃布", score: 2 },
                                                    { id: "type1e", text: "煤焦油瓷漆或环氧煤沥青", score: 2.5 },
                                                    { id: "type1f", text: "三层PE复合涂层", score: 3 },
                                                    { id: "type1g", text: "不需要外防腐层", score: 3 }
                                                ],
                                                selected: "type1g"
                                            }
                                        ]
                                    },
                                    {
                                        id: "coating_quality",
                                        title: "b) 外防腐层制造质量",
                                        maxScore: 4,
                                        collapsed: false,
                                        subitems: [
                                            {
                                                id: "quality_cert",
                                                title: "b.a) 外防腐层质量证明文件",
                                                maxScore: 1,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "cert1",
                                                        title: "质量证明文件",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "cert1a", text: "无外防腐层", score: 0 },
                                                            { id: "cert1b", text: "外防腐层无质量证明文件", score: 0 },
                                                            { id: "cert1c", text: "外防腐层质量证明文件齐全", score: 1 },
                                                            { id: "cert1d", text: "不需要外防腐层", score: 1 }
                                                        ],
                                                        selected: "cert1d"
                                                    }
                                                ]
                                            },
                                            {
                                                id: "quality_test",
                                                title: "b.b) 外防腐层复验",
                                                maxScore: 3,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "test1",
                                                        title: "外防腐层复验",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "test1a", text: "无外防腐层", score: 0 },
                                                            { id: "test1b", text: "未进行外防腐层复验", score: 0 },
                                                            { id: "test1c", text: "外防腐层复验不合格", score: 0 },
                                                            { id: "test1d", text: "外防腐层复验合格", score: 3 },
                                                            { id: "test1e", text: "不需要进行外防腐层复验", score: 3 },
                                                            { id: "test1f", text: "不需要外防腐层", score: 3 }
                                                        ],
                                                        selected: "test1f"
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "coating_construction",
                                        title: "c) 外防腐层施工质量",
                                        maxScore: 8,
                                        collapsed: false,
                                        subitems: [
                                            {
                                                id: "construction_inspection",
                                                title: "c.a) 外防腐层补口补伤检验和下沟前检验",
                                                maxScore: 3,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "coating_inspection1",
                                                        title: "检验选项",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "inspection1a", text: "无外防腐层", score: 0 },
                                                            { id: "inspection1b", text: "未进行外防腐层补口补伤检验和下沟前检验", score: 0 },
                                                            { id: "inspection1c", text: "外防腐层补口补伤检验或下沟前检验不合格", score: 0 },
                                                            { id: "inspection1d", text: "外防腐层补口补伤检验和下沟前检验合格", score: 3 },
                                                            { id: "inspection1e", text: "不需要外防腐层", score: 3 }
                                                        ],
                                                        selected: "inspection1e"
                                                    }
                                                ]
                                            },
                                            {
                                                id: "leak_test",
                                                title: "c.b) 外防腐层漏点检验",
                                                maxScore: 5,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "leak1",
                                                        title: "漏点检验",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "leak1a", text: "无外防腐层", score: 0 },
                                                            { id: "leak1b", text: "未进行外防腐层漏点检验", score: 0 },
                                                            { id: "leak1c", text: "外防腐层漏点检验不合格", score: 0 },
                                                            { id: "leak1d", text: "外防腐层漏点检验合格", score: 5 },
                                                            { id: "leak1e", text: "不需要外防腐层", score: 5 }
                                                        ],
                                                        selected: "leak1e"
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "coating_comprehensive",
                                        title: "d) 外防腐层全面检验",
                                        maxScore: 20,
                                        collapsed: false,
                                        subitems: [
                                            {
                                                id: "comprehensive_qualification",
                                                title: "d.a) 外防腐层全面检验人员资质",
                                                maxScore: 2,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "coating_qualification1",
                                                        title: "全面检验人员资质",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "qualification1a", text: "无外防腐层", score: 0 },
                                                            { id: "qualification1b", text: "未进行外防腐层全面检验", score: 0 },
                                                            { id: "qualification1c", text: "外防腐层全面检验人员无相应资质", score: 0 },
                                                            { id: "qualification1d", text: "外防腐层全面检验人员具备相应资质", score: 2 },
                                                            { id: "qualification1e", text: "不需要外防腐层", score: 2 }
                                                        ],
                                                        selected: "qualification1e"
                                                    }
                                                ]
                                            },
                                            {
                                                id: "comprehensive_items",
                                                title: "d.b) 外防腐层全面检验项目和周期",
                                                maxScore: 4,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "cp_items1",
                                                        title: "全面检验项目和周期",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "items1a", text: "无外防腐层", score: 0 },
                                                            { id: "items1b", text: "未进行外防腐层全面检验", score: 0 },
                                                            { id: "items1c", text: "外防腐层全面检验项目或周期不满足GB/T 19285的要求", score: 0 },
                                                            { id: "items1d", text: "外防腐层全面检验项目和周期满足GB/T 19285的要求", score: 4 },
                                                            { id: "items1e", text: "不需要外防腐层", score: 4 }
                                                        ],
                                                        selected: "items1e"
                                                    }
                                                ]
                                            },
                                            {
                                                id: "comprehensive_results",
                                                title: "d.c) 外防腐层全面检验结果",
                                                maxScore: 14,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "results1",
                                                        title: "全面检验结果",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "results1a", text: "无外防腐层", score: 0 },
                                                            { id: "results1b", text: "不进行外防腐层全面检验", score: 0 },
                                                            { id: "results1c", text: "管道区段的最大电流衰减率Y>0.023", score: 0 },
                                                            { id: "results1d", text: "管道区段的最大电流衰减率Y∈(0.015，0.023]", score: 5 },
                                                            { id: "results1e", text: "管道区段的最大电流衰减率Y∈(0.011，0.015]", score: 10 },
                                                            { id: "results1f", text: "管道区段的最大电流衰减率Y≤0.01", score: 14 },
                                                            { id: "results1g", text: "不需要外防腐层", score: 14 }
                                                        ],
                                                        selected: "results1g"
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "coating_maintenance",
                                        title: "e) 外防腐层维护",
                                        maxScore: 2,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "maintenance1",
                                                title: "外防腐层维护",
                                                noHeader: true,
                                                options: [
                                                    { id: "maintenance1a", text: "无外防腐层", score: 0 },
                                                    { id: "maintenance1b", text: "很少或者不关注外防腐层缺陷", score: 0 },
                                                    { id: "maintenance1c", text: "仅对部分外防腐层缺陷进行报告和修复", score: 0.5 },
                                                    { id: "maintenance1d", text: "非正式报告外防腐层缺陷，并在方便的时候才进行修复", score: 1 },
                                                    { id: "maintenance1e", text: "正式报告外防腐层缺陷，并形成修复计划，按计划进行修复", score: 2 },
                                                    { id: "maintenance1f", text: "不需要外防腐层", score: 2 }
                                                ],
                                                selected: "maintenance1f"
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                id: "D3445",
                                title: "D.3.4.4.5深根植被的评分",
                                maxScore: 1,
                                collapsed: false,
                                items: [
                                                                                {
                                                id: "vegetation1",
                                                title: "深根植被",
                                                noHeader: true,
                                                options: [
                                            { id: "vegetation1a", text: "管道区段两侧各5m范围内存在大量深根植物", score: 0 },
                                            { id: "vegetation1b", text: "管道区段两侧各5m范围内存在少量深根植物", score: 0.5 },
                                            { id: "vegetation1c", text: "管道区段两侧各5m范围内不存在深根植物", score: 1 }
                                        ],
                                        selected: "vegetation1c"
                                    }
                                ]
                            },
                            {
                                id: "D3446",
                                title: "D.3.4.4.6阴极保护系统的评分",
                                maxScore: 19,
                                collapsed: false,
                                subitems: [
                                    {
                                        id: "cps_quality",
                                        title: "a) 阴极保护系统产品质量",
                                        maxScore: 3,
                                        collapsed: false,
                                        subitems: [
                                            {
                                                id: "cps_quality_cert",
                                                title: "a.a) 阴极保护系统产品质量证明文件",
                                                maxScore: 1,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "cps_cert1",
                                                        title: "质量证明文件",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "cert1a", text: "未加阴极保护", score: 0 },
                                                            { id: "cert1b", text: "阴极保护系统产品无质量证明文件", score: 0 },
                                                            { id: "cert1c", text: "阴极保护系统产品质量证明文件齐全", score: 1 },
                                                            { id: "cert1d", text: "不需要进行阴极保护", score: 1 }
                                                        ],
                                                        selected: "cert1d"
                                                    }
                                                ]
                                            },
                                            {
                                                id: "cps_quality_test",
                                                title: "a.b) 阴极保护系统产品抽样复验",
                                                maxScore: 2,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "cps_test1",
                                                        title: "产品抽样复验",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "test1a", text: "未加阴极保护", score: 0 },
                                                            { id: "test1b", text: "未进行阴极保护系统产品抽样复验", score: 0 },
                                                            { id: "test1c", text: "阴极保护系统产品抽样复验不合格", score: 0 },
                                                            { id: "test1d", text: "阴极保护系统产品抽样复验合格", score: 2 },
                                                            { id: "test1e", text: "不需要进行阴极保护", score: 2 }
                                                        ],
                                                        selected: "test1e"
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "cps_install",
                                        title: "b) 阴极保护系统安装质量",
                                        maxScore: 3,
                                        collapsed: false,
                                        subitems: [
                                            {
                                                id: "install_control",
                                                title: "b.a) 阴极保护系统安装过程质量控制",
                                                maxScore: 1,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "control1",
                                                        title: "安装过程质量控制",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "control1a", text: "未加阴极保护", score: 0 },
                                                            { id: "control1b", text: "未进行阴极保护系统安装过程质量控制", score: 0 },
                                                            { id: "control1c", text: "阴极保护系统安装过程质量控制不满足GB/T 19285的要求", score: 0 },
                                                            { id: "control1d", text: "阴极保护系统安装过程质量控制基本满足GB/T 19285的要求", score: 0.5 },
                                                            { id: "control1e", text: "阴极保护系统安装过程质量控制满足GB/T 19285的要求", score: 1 },
                                                            { id: "control1f", text: "不需要进行阴极保护", score: 1 }
                                                        ],
                                                        selected: "control1f"
                                                    }
                                                ]
                                            },
                                            {
                                                id: "install_test",
                                                title: "b.b) 阴极保护系统投产测试",
                                                maxScore: 2,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "test2",
                                                        title: "投产测试",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "test2a", text: "未加阴极保护", score: 0 },
                                                            { id: "test2b", text: "未进行阴极保护系统投产测试", score: 0 },
                                                            { id: "test2c", text: "阴极保护系统投产测试结果不满足GB/T 19285的要求", score: 0 },
                                                            { id: "test2d", text: "阴极保护系统投产测试结果基本满足GB/T 19285的要求", score: 1 },
                                                            { id: "test2e", text: "阴极保护系统投产测试结果满足GB/T 19285的要求", score: 2 },
                                                            { id: "test2f", text: "不需要进行阴极保护", score: 2 }
                                                        ],
                                                        selected: "test2f"
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "cps_annual",
                                        title: "c) 阴极保护系统年度检查",
                                        maxScore: 3,
                                        collapsed: false,
                                        subitems: [
                                            {
                                                id: "annual_items",
                                                title: "c.a) 阴极保护系统年度检查项目和周期",
                                                maxScore: 1,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "annual1",
                                                        title: "年度检查项目和周期",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "annual1a", text: "未加阴极保护", score: 0 },
                                                            { id: "annual1b", text: "未进行阴极保护系统年度检查", score: 0 },
                                                            { id: "annual1c", text: "阴极保护系统年度检查项目或周期不满足GB/T 19285的要求", score: 0 },
                                                            { id: "annual1d", text: "阴极保护系统年度检查项目和周期满足GB/T 19285的要求", score: 1 },
                                                            { id: "annual1e", text: "不需要进行阴极保护", score: 1 }
                                                        ],
                                                        selected: "annual1e"
                                                    }
                                                ]
                                            },
                                            {
                                                id: "annual_results",
                                                title: "c.b) 阴极保护系统年度检查结果及异常情况处理",
                                                maxScore: 2,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "annual2",
                                                        title: "年度检查结果及异常情况处理",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "annual2a", text: "未加阴极保护", score: 0 },
                                                            { id: "annual2b", text: "未进行阴极保护系统年度检查", score: 0 },
                                                            { id: "annual2c", text: "阴极保护系统年度检查结果不满足GB/T 19285的要求，并且未进行相应处理或处理不当", score: 0 },
                                                            { id: "annual2d", text: "阴极保护系统年度检查结果不满足GB/T 19285的要求，但及时进行了适当处理", score: 2 },
                                                            { id: "annual2e", text: "阴极保护系统年度检查结果满足GB/T 19285的要求", score: 2 },
                                                            { id: "annual2f", text: "不需要进行阴极保护", score: 2 }
                                                        ],
                                                        selected: "annual2f"
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "cps_comprehensive",
                                        title: "d) 阴极保护系统全面检验",
                                        maxScore: 10,
                                        collapsed: false,
                                        subitems: [
                                            {
                                                id: "comprehensive_qualification",
                                                title: "d.a) 阴极保护系统全面检验人员资质",
                                                maxScore: 1,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "qualification2",
                                                        title: "全面检验人员资质",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "qualification2a", text: "未加阴极保护", score: 0 },
                                                            { id: "qualification2b", text: "未进行阴极保护系统全面检验", score: 0 },
                                                            { id: "qualification2c", text: "阴极保护系统全面检验人员无相应的资质", score: 0 },
                                                            { id: "qualification2d", text: "阴极保护系统全面检验人员具备相应的资质", score: 1 },
                                                            { id: "qualification2e", text: "不需要进行阴极保护", score: 1 }
                                                        ],
                                                        selected: "qualification2e"
                                                    }
                                                ]
                                            },
                                            {
                                                id: "comprehensive_items",
                                                title: "d.b) 阴极保护系统全面检验项目和周期",
                                                maxScore: 2,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "items1",
                                                        title: "全面检验项目和周期",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "items1a", text: "未加阴极保护", score: 0 },
                                                            { id: "items1b", text: "未进行阴极保护系统全面检验", score: 0 },
                                                            { id: "items1c", text: "阴极保护系统全面检验项目或周期不满足GB/T 19285的要求", score: 0 },
                                                            { id: "items1d", text: "阴极保护系统全面检验项目和周期满足GB/T 19285的要求", score: 2 },
                                                            { id: "items1e", text: "不需要进行阴极保护", score: 2 }
                                                        ],
                                                        selected: "items1e"
                                                    }
                                                ]
                                            },
                                            {
                                                id: "comprehensive_results",
                                                title: "d.c) 阴极保护系统全面检验结果及异常情况处理",
                                                maxScore: 7,
                                                collapsed: false,
                                                items: [
                                                    {
                                                        id: "cp_results1",
                                                        title: "全面检验结果及异常情况处理",
                                                        noHeader: true,
                                                        options: [
                                                            { id: "results1a", text: "未加阴极保护", score: 0 },
                                                            { id: "results1b", text: "未进行阴极保护系统全面检验，则为0分", score: 0 },
                                                            { id: "results1c", text: "阴极保护系统全面检验结果不满足GB/T 19285的要求，并且未进行相应处理或处理不当", score: 0 },
                                                            { id: "results1d", text: "阴极保护系统全面检验结果不满足GB/T 19285的要求，但及时进行了适当处理", score: 7 },
                                                            { id: "results1e", text: "阴极保护系统全面检验结果满足GB/T 19285的要求", score: 7 },
                                                            { id: "results1f", text: "不需要进行阴极保护", score: 7 }
                                                        ],
                                                        selected: "results1f"
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        id: "cps_test_head",
                                        title: "e) 阴极保护系统测试头间距",
                                        maxScore: 1,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "test_head",
                                                title: "测试头间距",
                                                noHeader: true,
                                                options: [
                                                    { id: "test_head1a", text: "未加阴极保护", score: 0 },
                                                    { id: "test_head1b", text: "测试头间距>3 km", score: 0 },
                                                    { id: "test_head1c", text: "测试头间距∈[2 km，3 km]，或有部分交叉管道和套管未监控", score: 0 },
                                                    { id: "test_head1d", text: "测试头间距<2 km，并且对管道附近所有地下金属设施监控", score: 1 },
                                                    { id: "test_head1e", text: "不需要进行阴极保护", score: 1 }
                                                ],
                                                selected: "test_head1e"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },

        ];
        this.renderScoringSystem(container, scoringData, 'corrosion');
    }
    // 渲染设备及操作模块 - 完整评分数据
    renderEquipmentModule(container) {
        const scoringData = [
            {
                id: "D42",
                title: "D.4.2设备功能及安全质量评分",
                maxScore: 26,
                collapsed: false,
                subitems: [
                    {
                        id: "D422",
                        title: "D.4.2.2设备性能和操作性评分",
                        maxScore: 5,
                        collapsed: false,
                        items: [
                            {
                                id: "perf1",
                                title: "设备性能和操作性评分",
                                options: [
                                    { id: "perf1a", text: "设备不满足技术要求", score: 0 },
                                    { id: "perf1b", text: "满足技术要求，但性能稳定性差，操作不方便", score: 1 },
                                    { id: "perf1c", text: "满足技术要求，安全可靠，但操作不方便", score: 3 },
                                    { id: "perf1d", text: "满足要求，安全可靠，操作方便", score: 5 }
                                ],
                                selected: "perf1d"
                            }
                        ]
                    },
                    {
                        id: "D423",
                        title: "D.4.2.3设备质量证明文件",
                        maxScore: 2,
                        collapsed: false,
                        items: [
                            {
                                id: "doc1",
                                title: "设备质量证明文件评分",
                                options: [
                                    { id: "doc1a", text: "无质量证明文件", score: 0 },
                                    { id: "doc1b", text: "质量证明文件齐全", score: 2 }
                                ],
                                selected: "doc1b"
                            }
                        ]
                    },
                    {
                        id: "D424",
                        title: "D.4.2.4设备检验的评分",
                        maxScore: 7,
                        collapsed: false,
                        subitems: [
                            {
                                id: "D4242",
                                title: "D.4.2.4.2设备检验周期评分",
                                maxScore: 2,
                                collapsed: false,
                                                        items: [
                            {
                                id: "cycle1",
                                title: "设备检验周期评分",
                                                                        options: [
                                            { id: "cycle1a", text: "不检验", score: 0 },
                                            { id: "cycle1b", text: "检验周期不满足法规要求", score: 0 },
                                            { id: "cycle1c", text: "满足法规要求", score: 2 },
                                            { id: "cycle1d", text: "不需要检验", score: 2 }
                                        ],
                                        selected: "cycle1d"
                                    }
                                ]
                            },
                            {
                                id: "D4243",
                                title: "D.4.2.4.3设备检验结果评分",
                                maxScore: 5,
                                collapsed: false,
                                items: [
                                    {
                                        id: "result1",
                                        title: "设备检验结果评分",
                                        options: [
                                            { id: "result1a", text: "不检验", score: 0 },
                                            { id: "result1b", text: "设备检验结果表明应停止使用或报废", score: 0 },
                                            { id: "result1c", text: "设备检验结果表明应监控使用", score: 1 },
                                            { id: "result1d", text: "设备检验结果表明应在限定条件下安全使用", score: 3 },
                                            { id: "result1e", text: "设备检验结果表明可在设计条件下安全使用", score: 5 },
                                            { id: "result1f", text: "不需要检验", score: 5 }
                                        ],
                                        selected: "result1f"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "D425",
                        title: "D.4.2.5设备计量的评分",
                        maxScore: 6,
                        collapsed: false,
                        subitems: [
                            {
                                id: "D4252",
                                title: "D.4.2.5.2设备计量周期评分",
                                maxScore: 2,
                                collapsed: false,
                                items: [
                                    {
                                        id: "measure1",
                                        title: "设备计量周期评分",
                                        options: [
                                            { id: "measure1a", text: "不计量", score: 0 },
                                            { id: "measure1b", text: "计量周期不满足有关法规、标准和质量体系文件的要求", score: 0 },
                                            { id: "measure1c", text: "计量周期满足有关法规、标准和质量体系文件的要求", score: 2 },
                                            { id: "measure1d", text: "不需要计量", score: 2 }
                                        ],
                                        selected: "measure1d"
                                    }
                                ]
                            },
                            {
                                id: "D4253",
                                title: "D.4.2.5.3设备计量状态评分",
                                maxScore: 4,
                                collapsed: false,
                                items: [
                                    {
                                        id: "status1",
                                        title: "设备计量状态评分",
                                        options: [
                                            { id: "status1a", text: "不计量", score: 0 },
                                            { id: "status1b", text: "超过计量有效期", score: 0 },
                                            { id: "status1c", text: "在计量有效期内", score: 4 },
                                            { id: "status1d", text: "不需要计量", score: 4 }
                                        ],
                                        selected: "status1d"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "D426",
                        title: "D.4.2.6超压保护装置",
                        maxScore: 3,
                        collapsed: false,
                        items: [
                            {
                                                                        id: "pressure1",
                                        title: "超压保护装置评分",
                                options: [
                                    { id: "pressure1a", text: "无超压保护或报警系统", score: 0 },
                                    { id: "pressure1b", text: "具备超压报警装置", score: 1 },
                                    { id: "pressure1c", text: "具备超压手动保护系统", score: 2 },
                                    { id: "pressure1d", text: "具备超压自动保护系统", score: 3 }
                                ],
                                selected: "pressure1d"
                            }
                        ]
                    },
                    {
                        id: "D427",
                        title: "D.4.2.7通讯系统评分",
                        maxScore: 2,
                        collapsed: false,
                        items: [
                            {
                                                                        id: "comms1",
                                        title: "通讯系统评分",
                                options: [
                                    { id: "comms1a", text: "通讯设备未固定专用", score: 0 },
                                    { id: "comms1b", text: "各个站间配有专用通讯系统和工具", score: 2 }
                                ],
                                selected: "comms1b"
                            }
                        ]
                    }
                ]
            },
            {
                id: "D43",
                title: "D.4.3设备维护保养评分",
                maxScore: 15,
                collapsed: false,
                subitems: [
                    {
                        id: "D432",
                        title: "D.4.3.2维护保养规程的评分",
                        maxScore: 5,
                        collapsed: false,
                        items: [
                            {
                                                                        id: "maint1",
                                        title: "维护保养规程评分",
                                options: [
                                    { id: "maint1a", text: "无设备（装置）维护保养规程", score: 0 },
                                    { id: "maint1b", text: "设备（装置）维护保养规程不完整", score: 3 },
                                    { id: "maint1c", text: "设备（装置）维护保养规程完整、正确", score: 5 }
                                ],
                                selected: "maint1c"
                            }
                        ]
                    },
                    {
                        id: "D433",
                        title: "D.4.3.3维护保养规程执行情况的评分",
                        maxScore: 10,
                        collapsed: false,
                        subitems: [
                            {
                                id: "D4332",
                                title: "D.4.3.3.2维护保养计划评分",
                                maxScore: 2,
                                collapsed: false,
                                items: [
                                    {
                                        id: "plan1",
                                        title: "维护保养计划评分",
                                        options: [
                                            { id: "plan1a", text: "无维护计划", score: 0 },
                                            { id: "plan1b", text: "进行不定期维护", score: 1 },
                                            { id: "plan1c", text: "进行定期维护", score: 2 }
                                        ],
                                        selected: "plan1c"
                                    }
                                ]
                            },
                            {
                                id: "D4333",
                                title: "D.4.3.3.3维护保养方式评分",
                                maxScore: 5,
                                collapsed: false,
                                items: [
                                    {
                                        id: "method1",
                                        title: "维护保养方式评分",
                                        options: [
                                            { id: "method1a", text: "不维护保养", score: 0 },
                                            { id: "method1b", text: "仅保养，不修理或更换", score: 2 },
                                            { id: "method1c", text: "进行保养，并且必要时修理", score: 3 },
                                            { id: "method1d", text: "进行保养，并且必要时更换", score: 5 }
                                        ],
                                        selected: "method1d"
                                    }
                                ]
                            },
                            {
                                id: "D4334",
                                title: "D.4.3.3.4维护保养记录的评分",
                                maxScore: 3,
                                collapsed: false,
                                items: [
                                    {
                                        id: "record1",
                                        title: "维护保养记录评分",
                                        options: [
                                            { id: "record1a", text: "未进行保养维护", score: 0 },
                                            { id: "record1b", text: "无维护保养记录和相关图纸", score: 0 },
                                            { id: "record1c", text: "维护保养记录相关图纸不完整", score: 1 },
                                            { id: "record1d", text: "维护保养记录和相关图纸齐全", score: 3 }
                                        ],
                                        selected: "record1d"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: "D44",
                title: "D.4.4设备操作得分",
                maxScore: 23,
                collapsed: false,
                subitems: [
                    {
                        id: "D442",
                        title: "D.4.4.2操作规程得分",
                        maxScore: 6,
                        collapsed: false,
                        items: [
                            {
                                                                        id: "op1",
                                        title: "操作规程评分",
                                options: [
                                    { id: "op1a", text: "无设备操作规程", score: 0 },
                                    { id: "op1b", text: "操作规程不完整", score: 2 },
                                    { id: "op1c", text: "操作规程完整、正确，但未放置于操作现场", score: 4 },
                                    { id: "op1d", text: "操作规程完整、正确，并且放置于操作现场", score: 6 }
                                ],
                                selected: "op1d"
                            }
                        ]
                    },
                    {
                        id: "D443",
                        title: "D.4.4.3操作规程执行情况",
                        maxScore: 13,
                        collapsed: false,
                        subitems: [
                            {
                                id: "D4432",
                                title: "D.4.4.3.2操作规程执行情况的审查得分",
                                maxScore: 8,
                                collapsed: false,
                                items: [
                                    {
                                        id: "review1",
                                        title: "操作规程执行情况审查评分",
                                        options: [
                                            { id: "review1a", text: "操作规程执行情况未进行审查", score: 0 },
                                            { id: "review1b", text: "操作规程执行情况进行一级审查（内部审查）", score: 4 },
                                            { id: "review1c", text: "操作规程执行情况进行二级审查（内部审查、外部审查）", score: 6 },
                                            { id: "review1d", text: "操作规程执行情况进行三级审查（内审、外审、第三方审查）", score: 8 }
                                        ],
                                        selected: "review1d"
                                    }
                                ]
                            },
                            {
                                id: "D4433",
                                title: "D.4.4.3.3操作记录和日志评分",
                                maxScore: 5,
                                collapsed: false,
                                items: [
                                    {
                                        id: "log1",
                                        title: "操作记录和日志评分",
                                        options: [
                                            { id: "log1a", text: "无操作记录和日志", score: 0 },
                                            { id: "log1b", text: "操作记录和日志不齐全", score: 2 },
                                            { id: "log1c", text: "操作记录和日志齐全", score: 5 }
                                        ],
                                        selected: "log1c"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "D444",
                        title: "D.4.4.4操作员工素质评分",
                        maxScore: 4,
                        collapsed: false,
                        subitems: [
                            {
                                id: "D4442",
                                title: "D.4.4.4.2操作员工专业评分",
                                maxScore: 1,
                                collapsed: false,
                                items: [
                                    {
                                        id: "prof1",
                                        title: "操作员工专业评分",
                                        options: [
                                            { id: "prof1a", text: "操作员工未在相关专业中专或大专完成系统学习", score: 0 },
                                            { id: "prof1b", text: "操作员工在相关专业中专或大专完成了系统学习", score: 1 }
                                        ],
                                        selected: "prof1b"
                                    }
                                ]
                            },
                            {
                                id: "D4443",
                                title: "D.4.4.4.3操作员工经验评分",
                                maxScore: 3,
                                collapsed: false,
                                items: [
                                    {
                                        id: "exp1",
                                        title: "操作员工经验评分",
                                        options: [
                                            { id: "exp1a", text: "操作员工无相关岗位工作经验", score: 0 },
                                            { id: "exp1b", text: "操作员工3年以下工作经验", score: 1 },
                                            { id: "exp1c", text: "操作员工3年及3年以上工作经验", score: 3 }
                                        ],
                                        selected: "exp1c"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: "D45",
                title: "D.4.5人员培训与考核评分",
                maxScore: 22,
                collapsed: false,
                subitems: [
                    {
                        id: "D452",
                        title: "D.4.5.2培训制度的评分",
                        maxScore: 5,
                        collapsed: false,
                        items: [
                            {
                                                                        id: "train1",
                                        title: "培训制度评分",
                                options: [
                                    { id: "train1a", text: "无培训制度，由领导临时决定是否进行培训", score: 0 },
                                    { id: "train1b", text: "没有建立培训制度，只对部分岗位的员工进行培训", score: 1 },
                                    { id: "train1c", text: "培训写入企业管理规章制度中，但仅对部分员工进行培训", score: 3 },
                                    { id: "train1d", text: "培训写入企业管理规章制度中，并且得到良好执行", score: 5 }
                                ],
                                selected: "train1d"
                            }
                        ]
                    },
                    {
                        id: "D453",
                        title: "D.4.5.3培训内容的评分",
                        maxScore: 4,
                        collapsed: false,
                        items: [
                            {
                                                                        id: "content1",
                                        title: "培训内容评分",
                                options: [
                                    { id: "content1a", text: "不进行培训", score: 0 },
                                    { id: "content1b", text: "培训无实质内容", score: 0 },
                                    { id: "content1c", text: "培训内容不全面，但进行了简单的培训", score: 2 },
                                    { id: "content1d", text: "培训内容全面，包括操作、操作规程，岗位对人员素质的要求等全部内容", score: 4 }
                                ],
                                selected: "content1d"
                            }
                        ]
                    },
                    {
                        id: "D454",
                        title: "D.4.5.4培训材料的评分",
                        maxScore: 4,
                        collapsed: false,
                        items: [
                            {
                                                                        id: "material1",
                                        title: "培训材料评分",
                                options: [
                                    { id: "material1a", text: "不进行培训", score: 0 },
                                    { id: "material1b", text: "没有正式培训材料", score: 0 },
                                    { id: "material1c", text: "培训材料简单，未经专家审核", score: 2 },
                                    { id: "material1d", text: "培训材料完整，并有行业内专家审核", score: 4 }
                                ],
                                selected: "material1d"
                            }
                        ]
                    },
                    {
                        id: "D455",
                        title: "D.4.5.5培训及考核方式的评分",
                        maxScore: 4,
                        collapsed: false,
                        items: [
                            {
                                                                        id: "method1",
                                        title: "培训及考核方式评分",
                                options: [
                                    { id: "method1a", text: "不进行培训", score: 0 },
                                    { id: "method1b", text: "进行没有考核的简单一次性培训", score: 0 },
                                    { id: "method1c", text: "进行一次性培训，培训结束后对员工进行笔试", score: 2 },
                                    { id: "method1d", text: "定期持续培训，培训结束后对员工进行面试、笔试评估等", score: 4 }
                                ],
                                selected: "method1d"
                            }
                        ]
                    },
                    {
                        id: "D456",
                        title: "D.4.5.6培训激励的评分",
                        maxScore: 5,
                        collapsed: false,
                        subitems: [
                            {
                                id: "D4562",
                                title: "D.4.5.6.2培训考核成绩优异员工的奖励评分",
                                maxScore: 1,
                                collapsed: false,
                                items: [
                                    {
                                        id: "reward1",
                                        title: "培训考核成绩优异员工奖励评分",
                                        options: [
                                            { id: "reward1a", text: "没有对考核成绩优异员工进行奖励", score: 0 },
                                            { id: "reward1b", text: "对考核成绩优异员工进行奖励", score: 1 }
                                        ],
                                        selected: "reward1b"
                                    }
                                ]
                            },
                            {
                                id: "D4562b",
                                title: "D.4.5.6.2对员工自发参加相关培训班的奖励评分",
                                maxScore: 1,
                                collapsed: false,
                                items: [
                                    {
                                        id: "spont1",
                                        title: "员工自发参加培训班奖励评分",
                                        options: [
                                            { id: "spont1a", text: "不对员工自发参加相关培训班进行奖励", score: 0 },
                                            { id: "spont1b", text: "对员工自发参加相关培训班进行奖励", score: 1 }
                                        ],
                                        selected: "spont1b"
                                    }
                                ]
                            },
                            {
                                id: "D4563",
                                title: "D.4.5.6.3实际操作考察评分",
                                maxScore: 1,
                                collapsed: false,
                                items: [
                                    {
                                        id: "practice1",
                                        title: "实际操作考察评分",
                                        options: [
                                            { id: "practice1a", text: "不注重对员工进行实际操作考察", score: 0 },
                                            { id: "practice1b", text: "注重对员工进行实际操作考察", score: 1 }
                                        ],
                                        selected: "practice1b"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: "D46",
                title: "D.4.6安全管理制度的评分",
                maxScore: 8,
                collapsed: false,
                subitems: [
                    {
                        id: "D462",
                        title: "D.4.6.2安全责任制的评分",
                        maxScore: 4,
                        collapsed: false,
                        items: [
                            {
                                                                        id: "resp1",
                                        title: "安全责任制评分",
                                options: [
                                    { id: "resp1a", text: "无安全责任制", score: 0 },
                                    { id: "resp1b", text: "有安全责任制，但未严格执行", score: 2 },
                                    { id: "resp1c", text: "安全责任制健全，并严格执行", score: 4 }
                                ],
                                selected: "resp1c"
                            }
                        ]
                    },
                    {
                        id: "D463",
                        title: "D.4.6.3安全机构和人员的评分",
                        maxScore: 4,
                        collapsed: false,
                        items: [
                            {
                                                                        id: "org1",
                                        title: "安全机构和人员评分",
                                options: [
                                    { id: "org1a", text: "无安全机构和人员", score: 0 },
                                    { id: "org1b", text: "设置安全机构，但人员缺乏", score: 2 },
                                    { id: "org1c", text: "设置安全机构，配备充足的专、兼职人员", score: 4 }
                                ],
                                selected: "org1c"
                            }
                        ]
                    }
                ]
            },
            {
                id: "D47",
                title: "D.4.7防错装置评分",
                maxScore: 6,
                collapsed: false,
                subitems: [
                    {
                        id: "D472",
                        title: "D.4.7.2防止误操作的硬件措施",
                        maxScore: 3,
                        collapsed: false,
                        subitems: [
                            {
                                id: "D4722",
                                title: "D.4.7.2.2硬件适用性评分",
                                maxScore: 1,
                                collapsed: false,
                                items: [
                                    {
                                        id: "hard1",
                                        title: "硬件适用性评分",
                                        options: [
                                            { id: "hard1a", text: "硬件不适用于防止误操作", score: 0 },
                                            { id: "hard1b", text: "硬件设计合理，适用于防止误操作", score: 1 }
                                        ],
                                        selected: "hard1b"
                                    }
                                ]
                            },
                            {
                                id: "D4723",
                                title: "D.4.7.2.3硬件制造单位资质评分",
                                maxScore: 2,
                                collapsed: false,
                                items: [
                                    {
                                        id: "qual1",
                                        title: "硬件制造单位资质评分",
                                        options: [
                                            { id: "qual1a", text: "硬件制造单位无相应制造资质", score: 0 },
                                            { id: "qual1b", text: "硬件制造单位有相应制造资质", score: 2 },
                                            { id: "qual1c", text: "硬件制造单位不需要制造资质", score: 2 }
                                        ],
                                        selected: "qual1c"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "D473",
                        title: "D.4.7.3联锁装置评分",
                        maxScore: 3,
                        collapsed: false,
                        items: [
                            {
                                                                        id: "interlock1",
                                        title: "联锁装置评分",
                                options: [
                                    { id: "interlock1a", text: "无联锁装置", score: 0 },
                                    { id: "interlock1b", text: "具有可靠自动联锁装置", score: 3 }
                                ],
                                selected: "interlock1b"
                            }
                        ]
                    },
                    {
                        id: "D474",
                        title: "D.4.7.4通过计算机软件控制操作步骤的评分",
                        maxScore: 3,
                        collapsed: false,
                        items: [
                            {
                                                                        id: "soft1",
                                        title: "计算机软件控制操作步骤评分",
                                options: [
                                    { id: "soft1a", text: "不通过计算机软件控制操作步骤控制", score: 0 },
                                    { id: "soft1b", text: "通过计算机软件控制操作步骤控制，但软件的可靠性和健壮性未经证实", score: 0 },
                                    { id: "soft1c", text: "通过计算机软件控制操作步骤控制，并且已经证实软件的可靠性和健壮性", score: 3 }
                                ],
                                selected: "soft1c"
                            }
                        ]
                    }
                ]
            }
        ];
        this.renderScoringSystem(container, scoringData, 'equipment');
    }
    // 渲染管道本质安全模块 - 完整评分数据
    renderSafetyModule(container) {
        const scoringData = [
            {
                                 id: "D52",
                 title: "D.5.2设计施工控制的评分",
                 maxScore: 75,
                collapsed: true,
                subitems: [
                    {
                        id: "D522",
                        title: "D.5.2.2设计控制的评分",
                        maxScore: 6,
                        collapsed: false,
                        subitems: [
                            {
                                id: "D5222",
                                title: "D.5.2.2.2设计单位和人员的资质评分",
                                maxScore: 1,
                                collapsed: false,
                                items: [
                                    {
                                        id: "designQual1",
                                        title: "设计单位资质",
                                        noHeader: false,
                                        options: [
                                            { id: "dq1", text: "设计单位或人员不具备与管道类别相应的设计资质", score: 0 },
                                            { id: "dq2", text: "设计单位和人员具备与管道类别相应的设计资质", score: 1 }
                                        ],
                                        selected: "dq2"
                                    }
                                ]
                            },
                            {
                                id: "D5223",
                                title: "D.5.2.2.3设计标准规范的评分",
                                maxScore: 1,
                                collapsed: false,
                                items: [
                                    {
                                        id: "standard1",
                                        title: "设计标准规范",
                                        noHeader: false,
                                        options: [
                                            { id: "std1", text: "未按标准规范设计或采用当时已经作废的设计标准规范", score: 0 },
                                            { id: "std2", text: "采用当时有效的旧版本管道设计标准规范", score: 0.5 },
                                            { id: "std3", text: "采用现行标准规范", score: 1 }
                                        ],
                                        selected: "std3"
                                    }
                                ]
                            },
                            {
                                id: "D5224",
                                title: "D.5.2.2.4设计文件审批的评分",
                                maxScore: 1,
                                collapsed: false,
                                items: [
                                    {
                                        id: "approval1",
                                        title: "设计文件审批",
                                        noHeader: false,
                                        options: [
                                            { id: "app1", text: "设计文件未经过审批", score: 0 },
                                            { id: "app2", text: "设计文件经过专人严格审批", score: 1 }
                                        ],
                                        selected: "app2"
                                    }
                                ]
                            },
                            {
                                id: "D5225",
                                title: "D.5.2.2.5危险识别的评分",
                                maxScore: 2,
                                collapsed: false,
                                items: [
                                    {
                                        id: "risk1",
                                        title: "危险识别",
                                        noHeader: false,
                                        options: [
                                            { id: "risk1a", text: "没有事先制定设计方案，未进行危险识别分析", score: 0 },
                                            { id: "risk1b", text: "设计方案不严密，由无资质单位和人员进行危险识别分析", score: 1 },
                                            { id: "risk1c", text: "完全按照设计规范制定设计方案，进行了严格的危险识别分析", score: 2 }
                                        ],
                                        selected: "risk1c"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: "D523",
                        title: "D.5.2.3管道元件控制评分",
                        maxScore: 6,
                        collapsed: false,
                        subitems: [
                            {
                                id: "D5232",
                                title: "D.5.2.3.2管道元件制造单位的资质评分",
                                maxScore: 1,
                                collapsed: false,
                                items: [
                                    {
                                        id: "manuQual1",
                                        title: "制造单位资质",
                                        noHeader: false,
                                        options: [
                                            { id: "mq1", text: "管道元件制造单位不具备制造资质", score: 0 },
                                            { id: "mq2", text: "管道元件制造单位具备资质", score: 1 }
                                        ],
                                        selected: "mq2"
                                    }
                                ]
                            },
                            {
                                id: "D5233",
                                title: "D.5.2.3.3管道元件质量评分",
                                maxScore: 3,
                                collapsed: false,
                                subitems: [
                                    {
                                        id: "qualityDoc",
                                        title: "管道元件质量证明文件",
                                        maxScore: 1,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "doc1",
                                                title: "质量证明文件",
                                                noHeader: false,
                                                options: [
                                                    { id: "doc1a", text: "无管道元件质量证明文件", score: 0 },
                                                    { id: "doc1b", text: "管道元件质量证明文件齐全", score: 1 }
                                                ],
                                                selected: "doc1b"
                                            }
                                        ]
                                    },
                                    {
                                        id: "inspection",
                                        title: "管道元件进货检验",
                                        maxScore: 1,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "insp1",
                                                title: "进货检验",
                                                noHeader: false,
                                                options: [
                                                    { id: "insp1a", text: "未进行进货检验", score: 0 },
                                                    { id: "insp1b", text: "进货检验不合格", score: 0 },
                                                    { id: "insp1c", text: "进货检验合格", score: 1 }
                                                ],
                                                selected: "insp1c"
                                            }
                                        ]
                                    },
                                    {
                                        id: "transport",
                                        title: "管道元件储运与搬运",
                                        maxScore: 1,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "trans1",
                                                title: "储运与搬运",
                                                noHeader: false,
                                                options: [
                                                    { id: "trans1a", text: "储运与搬运过程中管道元件受到严重的损坏", score: 0 },
                                                    { id: "trans1b", text: "储运与搬运过程中管道元件受到一定程度的损坏", score: 0.5 },
                                                    { id: "trans1c", text: "储运与搬运过程中管道元件无损坏", score: 1 }
                                                ],
                                                selected: "trans1c"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                                                 id: "D524",
                         title: "D.5.2.4安装与验收的评分",
                         maxScore: 45,
                        collapsed: false,
                        subitems: [
                            {
                                id: "D5242",
                                title: "D.5.2.4.2安装单位的资质评分",
                                maxScore: 1,
                                collapsed: false,
                                items: [
                                    {
                                        id: "installQual1",
                                        title: "安装单位资质",
                                        noHeader: false,
                                        options: [
                                            { id: "iq1", text: "安装单位不具备与管道类别相应的安装资质", score: 0 },
                                            { id: "iq2", text: "安装单位具备相应资质，但经验不足", score: 0.5 },
                                            { id: "iq3", text: "安装单位具备相应资质，经验丰富", score: 1 }
                                        ],
                                        selected: "iq3"
                                    }
                                ]
                            },
                            {
                                id: "D5243",
                                title: "D.5.2.4.3施工组织的评分",
                                maxScore: 4,
                                collapsed: false,
                                subitems: [
                                    {
                                        id: "projectMgmt",
                                        title: "项目管理",
                                        maxScore: 1,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "pm1",
                                                title: "项目管理",
                                                noHeader: false,
                                                options: [
                                                    { id: "pm1a", text: "未实现严格的项目管理", score: 0 },
                                                    { id: "pm1b", text: "实现严格的项目管理", score: 1 }
                                                ],
                                                selected: "pm1b"
                                            }
                                        ]
                                    },
                                    {
                                        id: "constructionGuide",
                                        title: "施工指导",
                                        maxScore: 1,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "cg1",
                                                title: "施工指导",
                                                noHeader: false,
                                                options: [
                                                    { id: "cg1a", text: "未由经验丰富的设计代表现场指导施工", score: 0 },
                                                    { id: "cg1b", text: "由经验丰富的设计代表现场指导施工", score: 1 }
                                                ],
                                                selected: "cg1b"
                                            }
                                        ]
                                    },
                                    {
                                        id: "meetings",
                                        title: "例会",
                                        maxScore: 1,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "mtg1",
                                                title: "例会",
                                                noHeader: false,
                                                options: [
                                                    { id: "mtg1a", text: "未做到例会每天召开，及时发现施工中的问题并立即处理", score: 0 },
                                                    { id: "mtg1b", text: "每天召开例会，及时发现施工中的问题并立即处理", score: 1 }
                                                ],
                                                selected: "mtg1b"
                                            }
                                        ]
                                    },
                                    {
                                        id: "qualityControl",
                                        title: "施工质量管理",
                                        maxScore: 1,
                                        collapsed: false,
                                        items: [
                                            {
                                                id: "qc1",
                                                title: "质量管理",
                                                noHeader: false,
                                                options: [
                                                    { id: "qc1a", text: "未在施工过程中实行严格的质量控制", score: 0 },
                                                    { id: "qc1b", text: "在施工过程中实行严格的质量控制", score: 1 }
                                                ],
                                                selected: "qc1b"
                                            }
                                        ]
                                    }
                                ]
                            },

                                                         {
                                 id: "D5244",
                                 title: "D.5.2.4.4管道元件预处理的评分",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "preprocess1",
                                         title: "管道元件预处理",
                                         noHeader: false,
                                         options: [
                                             { id: "pre1a", text: "管道元件表面有可见的油渍和污垢，或者附有不牢的氧化皮、铁锈和涂料涂层等附着物", score: 0 },
                                             { id: "pre1b", text: "管道元件表面无可见的油渍和污垢，并且没有附着不牢的氧化皮，铁锈和涂料涂层等附着物", score: 0.5 },
                                             { id: "pre1c", text: "管道元件表面无可见的油渍、污垢、氧化皮、铁锈和涂料涂层等附着物，表面显示均匀金属光泽", score: 1 }
                                         ],
                                         selected: "pre1c"
                                     }
                                 ]
                             },
                             {
                                 id: "D5245",
                                 title: "D.5.2.4.5材料误用、混用情况的评分",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "material1",
                                         title: "材料误用、混用情况",
                                         noHeader: false,
                                         options: [
                                             { id: "mat1a", text: "存在材料误用、混用", score: 0 },
                                             { id: "mat1b", text: "不存在材料误用、混用", score: 1 }
                                         ],
                                         selected: "mat1b"
                                     }
                                 ]
                             },
                             {
                                 id: "D5246",
                                 title: "D.5.2.4.6开槽控制的评分（GB 50028）",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "trench1",
                                         title: "开槽控制",
                                         noHeader: false,
                                         options: [
                                             { id: "tren1a", text: "未进行开槽控制", score: 0 },
                                             { id: "tren1b", text: "开槽不满足相应标准规范的要求", score: 0 },
                                             { id: "tren1c", text: "开槽满足相应标准规范的要求", score: 1 }
                                         ],
                                         selected: "tren1c"
                                     }
                                 ]
                             },
                             {
                                 id: "D5247",
                                 title: "D.5.2.4.7焊接及其检验的评分",
                                 maxScore: 6,
                                 collapsed: false,
                                 subitems: [
                                     {
                                         id: "welderQual",
                                         title: "焊接操作人员资质",
                                         maxScore: 1,
                                         collapsed: false,
                                         items: [
                                             {
                                                 id: "wq1",
                                                 title: "焊接操作人员资质",
                                                 noHeader: false,
                                                 options: [
                                                     { id: "wq1a", text: "焊接操作人员无相应资质", score: 0 },
                                                     { id: "wq1b", text: "焊接操作人员有相应资质", score: 1 }
                                                 ],
                                                 selected: "wq1b"
                                             }
                                         ]
                                     },
                                     {
                                         id: "weldingProc",
                                         title: "焊接工艺程序及焊接工艺评定记录",
                                         maxScore: 1,
                                         collapsed: false,
                                         items: [
                                             {
                                                 id: "wp1",
                                                 title: "焊接工艺程序及焊接工艺评定记录",
                                                 noHeader: false,
                                                 options: [
                                                     { id: "wp1a", text: "没有焊接工艺程序及焊接工艺评定记录", score: 0 },
                                                     { id: "wp1b", text: "有焊接工艺程序，但无相应的焊接工艺评定记录", score: 1 },
                                                     { id: "wp1c", text: "焊接工艺程序和焊接工艺评定记录齐全", score: 1 }
                                                 ],
                                                 selected: "wp1c"
                                             }
                                         ]
                                     },
                                     {
                                         id: "weldingInspect",
                                         title: "焊接检测",
                                         maxScore: 1,
                                         collapsed: false,
                                         items: [
                                             {
                                                 id: "wi1",
                                                 title: "焊接检测",
                                                 noHeader: false,
                                                 options: [
                                                     { id: "wi1a", text: "检测单位和人员不具备检测资质", score: 0 },
                                                     { id: "wi1b", text: "检测单位和人员具备检测资质，但未按照JB/T 4730进行检测", score: 0 },
                                                     { id: "wi1c", text: "检测单位和人员具备检测资质，并且严格按照JB/T 4730进行检测", score: 1 }
                                                 ],
                                                 selected: "wi1c"
                                             }
                                         ]
                                     },
                                     {
                                         id: "weldingQuality",
                                         title: "焊接质量",
                                         maxScore: 3,
                                         collapsed: false,
                                         items: [
                                             {
                                                 id: "wqual1",
                                                 title: "焊接质量",
                                                 noHeader: false,
                                                 options: [
                                                     { id: "wqual1a", text: "焊缝含有不能通过GB/T 19624进行的安全评定的缺陷，取失效可能性S为100", score: null },
                                                     { id: "wqual1b", text: "焊缝含有能通过GB/T 19624进行的安全评定的缺陷", score: 1.5 },
                                                     { id: "wqual1c", text: "焊缝不含缺陷", score: 3 }
                                                 ],
                                                 selected: "wqual1c"
                                             }
                                         ]
                                     }
                                 ]
                             },
                             {
                                 id: "D5248",
                                 title: "D.5.2.4.8回填控制的评分（GB 50028)",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "backfill1",
                                         title: "回填控制",
                                         noHeader: false,
                                         options: [
                                             { id: "bf1a", text: "回填工艺或回填土质量，厚度不满足相应标准规范的要求", score: 0 },
                                             { id: "bf1b", text: "回填工艺和回填土质量，厚度均满足相应标准规范的要求", score: 1 }
                                         ],
                                         selected: "bf1b"
                                     }
                                 ]
                             },
                             {
                                 id: "D5249",
                                 title: "D.5.2.4.9强度试验的评分(GB 50251)",
                                 maxScore: 3,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "strength1",
                                         title: "强度试验(GB 50251)",
                                         noHeader: false,
                                         inputType: "number",
                                         minValue: 0,
                                         maxValue: 3,
                                         step: 0.1,
                                         placeholder: "未进行强度试验/强度试验不符合相关标准规范0分，进行了符合相关标准规范的强度试验，点击去计算进行计算",
                                         defaultValue: 0,
                                         showCalculator: true
                                     }
                                 ]
                             },
                             {
                                 id: "D52410",
                                 title: "D.5.2.4.10严密性试验的评分(GB 50251)",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "tightness1",
                                         title: "严密性试验",
                                         noHeader: false,
                                         options: [
                                             { id: "tight1a", text: "未进行严密性试验", score: 0 },
                                             { id: "tight1b", text: "严密性试验不符合相关标准规范规定", score: 0 },
                                             { id: "tight1c", text: "严密性试验符合相关标准规范规定", score: 1 }
                                         ],
                                         selected: "tight1c"
                                     }
                                 ]
                             },
                             {
                                 id: "D52411",
                                 title: "D.5.2.4.11清管或干燥的评分",
                                 maxScore: 2,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "cleaning1",
                                         title: "清管或干燥",
                                         noHeader: false,
                                         options: [
                                             { id: "clean1a", text: "未清管和/或干燥", score: 0 },
                                             { id: "clean1b", text: "清管和/或干燥不满足与管道类别相应的标准和规范要求", score: 0 },
                                             { id: "clean1c", text: "清管和/或干燥基本满足与管道类别相应的标准和规范要求", score: 1 },
                                             { id: "clean1d", text: "清管和/或干燥满足与管道类别相应的标准和规范要求", score: 2 },
                                             { id: "clean1e", text: "不需要清管和/或干燥", score: 2 }
                                         ],
                                         selected: "clean1e"
                                     }
                                 ]
                             },
                             {
                                 id: "D52412",
                                 title: "D.5.2.4.12竣工验收的评分",
                                 maxScore: 2,
                                 collapsed: false,
                                 subitems: [
                                     {
                                         id: "selfAccept",
                                         title: "施工单位自验收",
                                         maxScore: 1,
                                         collapsed: false,
                                         items: [
                                             {
                                                 id: "sa1",
                                                 title: "施工单位自验收",
                                                 noHeader: false,
                                                 options: [
                                                     { id: "sa1a", text: "未进行施工单位自验收", score: 0 },
                                                     { id: "sa1b", text: "施工单位自验收不合格", score: 0 },
                                                     { id: "sa1c", text: "施工单位自验收合格", score: 1 }
                                                 ],
                                                 selected: "sa1c"
                                             }
                                         ]
                                     },
                                     {
                                         id: "expertAccept",
                                         title: "业务组织专家验收",
                                         maxScore: 1,
                                         collapsed: false,
                                         items: [
                                             {
                                                 id: "ea1",
                                                 title: "业务组织专家验收",
                                                 noHeader: false,
                                                 options: [
                                                     { id: "ea1a", text: "未进行业务组织专家验收", score: 0 },
                                                     { id: "ea1b", text: "业务组织专家验收不合格", score: 0 },
                                                     { id: "ea1c", text: "业务组织专家验收合格", score: 1 }
                                                 ],
                                                 selected: "ea1c"
                                             }
                                         ]
                                     }
                                 ]
                             }
                         ]
                     },
                     {
                         id: "D525",
                         title: "D.5.2.5附加安全裕度的评分",
                         maxScore: 2,
                         collapsed: false,
                         items: [
                             {
                                 id: "safetyMargin1",
                                 title: "附加安全裕度",
                                 noHeader: false,
                                 inputType: "number",
                                 minValue: -999,
                                 maxValue: 2,
                                 step: 0.1,
                                 placeholder: "请输入0-2之间的数值，附加安全裕度小于0时，失效可能性为100",
                                 defaultValue: 0,
                                showCalculator: true
                             }
                         ]
                     },
                     {
                         id: "D526",
                         title: "D.5.2.6安全保护措施的评分",
                         maxScore: 3,
                         collapsed: false,
                         subitems: [
                             {
                                 id: "D5262",
                                 title: "D.5.2.6.2输气管道、集气管道和城镇燃气管道安全保护措施",
                                 maxScore: 3,
                                 collapsed: false,
                                 subitems: [
                                     {
                                         id: "lowPoint",
                                         title: "翻越点后低洼段，泵站出站段的安全保护装置",
                                         maxScore: 1,
                                         collapsed: false,
                                         items: [
                                             {
                                                 id: "lp1",
                                                 title: "翻越点后低洼段，泵站出站段的安全保护装置",
                                                 noHeader: false,
                                                 options: [
                                                     { id: "lp1a", text: "无安全保护装置", score: 0 },
                                                     { id: "lp1b", text: "有安全保护装置，但设备选型不合理", score: 0.5 },
                                                     { id: "lp1c", text: "有安全保护装置，并且设备选型合理", score: 1 },
                                                     { id: "lp1d", text: "是非翻越点后低洼段、泵站出站段", score: 1 }
                                                 ],
                                                 selected: "lp1d"
                                             }
                                         ]
                                     },
                                     {
                                         id: "roadCross",
                                         title: "穿越公路的安全保护措施",
                                         maxScore: 1,
                                         collapsed: false,
                                         items: [
                                             {
                                                 id: "rc1",
                                                 title: "穿越公路的安全保护措施",
                                                 noHeader: false,
                                                 options: [
                                                     { id: "rc1a", text: "未加厚管壁或采用其他安全保护措施", score: 0 },
                                                     { id: "rc1b", text: "采用加厚管壁或采用其他有效的安全保护措施", score: 1 },
                                                     { id: "rc1c", text: "是非穿越公路的区段", score: 1 }
                                                 ],
                                                 selected: "rc1c"
                                             }
                                         ]
                                     },
                                     {
                                         id: "riverCross",
                                         title: "穿越河流的安全保护措施",
                                         maxScore: 1,
                                         collapsed: false,
                                         items: [
                                             {
                                                 id: "rvc1",
                                                 title: "穿越河流的安全保护措施",
                                                 noHeader: false,
                                                 options: [
                                                     { id: "rvc1a", text: "未加设防震措施或采用其他安全保护措施", score: 0 },
                                                     { id: "rvc1b", text: "加设防震措施或采用其他有效的安全保护措施", score: 1 },
                                                     { id: "rvc1c", text: "非穿越河流的区段", score: 1 }
                                                 ],
                                                 selected: "rvc1c"
                                             }
                                         ]
                                     }
                                 ]
                             }
                         ]
                     },
                     {
                         id: "D527",
                         title: "D.5.2.7监检评分",
                         maxScore: 3,
                         collapsed: false,
                         subitems: [
                             {
                                 id: "D5272",
                                 title: "D.5.2.7.2监检单位及人员的资质评分",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "supervisionQual1",
                                         title: "监检单位及人员的资质",
                                         noHeader: false,
                                         options: [
                                             { id: "sq1a", text: "管道安装时未进行监检", score: 0 },
                                             { id: "sq1b", text: "管道监检单位或人员不具备监检资质", score: 0 },
                                             { id: "sq1c", text: "管道监检单位或人员具备监检资质", score: 1 }
                                         ],
                                         selected: "sq1c"
                                     }
                                 ]
                             },
                             {
                                 id: "D5273",
                                 title: "D.5.2.7.3监检工作执行情况的评分",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "supervisionExec1",
                                         title: "监检工作执行情况",
                                         noHeader: false,
                                         options: [
                                             { id: "se1a", text: "管道安装时未进行监检", score: 0 },
                                             { id: "se1b", text: "监检工作未按照监检大纲（或计划）进行", score: 0 },
                                             { id: "se1c", text: "监检工作严格按照监检大纲（或计划）进行", score: 1 }
                                         ],
                                         selected: "se1c"
                                     }
                                 ]
                             },
                             {
                                 id: "D5274",
                                 title: "D.5.2.7.4监检结论的评分",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "supervisionResult1",
                                         title: "监检结论",
                                         noHeader: false,
                                         options: [
                                             { id: "sr1a", text: "未进行监检", score: 0 },
                                             { id: "sr1b", text: "无监检报告", score: 0 },
                                             { id: "sr1c", text: "监检结论为不合格", score: 0 },
                                             { id: "sr1d", text: "监检结论为合格", score: 1 }
                                         ],
                                         selected: "sr1d"
                                     }
                                 ]
                             }
                         ]
                     },
                     {
                         id: "D528",
                         title: "D.5.2.8监理评分",
                         maxScore: 3,
                         collapsed: false,
                         subitems: [
                             {
                                 id: "D5282",
                                 title: "D.5.2.8.2监理单位及人员资质",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "managementQual1",
                                         title: "监理单位及人员资质",
                                         noHeader: false,
                                         options: [
                                             { id: "mq1a", text: "管道安装时未进行监理", score: 0 },
                                             { id: "mq1b", text: "管道监理单位和人员不具备资质", score: 0 },
                                             { id: "mq1c", text: "管道监理单位和人员具备资质", score: 1 }
                                         ],
                                         selected: "mq1c"
                                     }
                                 ]
                             },
                             {
                                 id: "D5283",
                                 title: "D.5.2.8.3监理工作执行情况",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "managementExec1",
                                         title: "监理工作执行情况",
                                         noHeader: false,
                                         options: [
                                             { id: "me1a", text: "未进行监理", score: 0 },
                                             { id: "me1b", text: "监理工作未按照监理大纲（或计划）进行", score: 0 },
                                             { id: "me1c", text: "监理工作严格按照监理大纲（或计划）进行", score: 1 }
                                         ],
                                         selected: "me1c"
                                     }
                                 ]
                             },
                             {
                                 id: "D5284",
                                 title: "D.5.2.8.4监理结论",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "managementResult1",
                                         title: "监理结论",
                                         noHeader: false,
                                         options: [
                                             { id: "mr1a", text: "未进行监理", score: 0 },
                                             { id: "mr1b", text: "无监理报告", score: 0 },
                                             { id: "mr1c", text: "监理结论为不合格", score: 0 },
                                             { id: "mr1d", text: "监理结论为合格", score: 1 }
                                         ],
                                         selected: "mr1d"
                                     }
                                 ]
                             }
                         ]
                     },
                     {
                         id: "D529",
                         title: "D.5.2.9记录和图纸的评分",
                         maxScore: 4,
                         collapsed: false,
                         subitems: [
                             {
                                 id: "D5292",
                                 title: "D.5.2.9.2材料使用记录",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "materialRecord1",
                                         title: "材料使用记录",
                                         noHeader: false,
                                         options: [
                                             { id: "mr1a", text: "无材料使用记录", score: 0 },
                                             { id: "mr1b", text: "材料使用记录不完整", score: 0.5 },
                                             { id: "mr1c", text: "有完整详细的材料使用记录", score: 1 }
                                         ],
                                         selected: "mr1c"
                                     }
                                 ]
                             },
                             {
                                 id: "D5293",
                                 title: "D.5.2.9.3施工检验记录评分",
                                 maxScore: 2,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "constructionRecord1",
                                         title: "施工检验记录",
                                         noHeader: false,
                                         options: [
                                             { id: "cr1a", text: "无任何检验记录", score: 0 },
                                             { id: "cr1b", text: "无修补记录，其他记录完整", score: 0.5 },
                                             { id: "cr1c", text: "检验记录不连续", score: 1 },
                                             { id: "cr1d", text: "只有焊口探伤检验记录，无其他记录", score: 1.5 },
                                             { id: "cr1e", text: "重要施工环节有检验记录，其他环节无检验记录", score: 1.8 },
                                             { id: "cr1f", text: "施工全过程均有完整的检验记录", score: 2 }
                                         ],
                                         selected: "cr1f"
                                     }
                                 ]
                             },
                             {
                                 id: "D5294",
                                 title: "D.5.2.9.4图纸评分",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "drawing1",
                                         title: "图纸",
                                         noHeader: false,
                                         options: [
                                             { id: "dr1a", text: "无图纸", score: 0 },
                                             { id: "dr1b", text: "图纸不齐全", score: 0.5 },
                                             { id: "dr1c", text: "图纸齐全", score: 1 }
                                         ],
                                         selected: "dr1c"
                                     }
                                 ]
                             }
                         ]
                     }
                 ]
             },
            {
                                 id: "D53",
                                 title: "D.5.3检测及评价的评分",
                maxScore: 34,
                collapsed: true,
                subitems: [



                                         {
                         id: "D534",
                         title: "D.5.3.4城市燃气管道检测及评价的评分",
                         maxScore: 34,
                         collapsed: false,
                         subitems: [
                             {
                                 id: "D5342",
                                 title: "D.5.3.4.2管道使用年数的评分",
                                 maxScore: 5,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "age1",
                                         title: "管道使用年数",
                                         noHeader: false,
                                         options: [
                                             { id: "age1a", text: "管道使用年数小于等于5年，或者大于等于25年", score: 0 },
                                             { id: "age1b", text: "管道使用年数大于5小于25", score: 5 }
                                         ],
                                         selected: "age1b"
                                     }
                                 ]
                             },
                             {
                                 id: "D5343",
                                 title: "D.5.3.4.3泄漏检测的评分",
                                 maxScore: 4,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "leak1",
                                         title: "泄漏检测",
                                         noHeader: false,
                                         options: [
                                             { id: "leak1a", text: "未进行泄漏检测", score: 0 },
                                             { id: "leak1b", text: "泄漏检测周期过长，不满足实际需要", score: 1 },
                                             { id: "leak1c", text: "泄漏检测周期基本满足实际需要", score: 2 },
                                             { id: "leak1d", text: "泄漏检测周期满足实际需要", score: 4 }
                                         ],
                                         selected: "leak1d"
                                     }
                                 ]
                             },
                             {
                                 id: "D5344",
                                 title: "D.5.3.4.4管体缺陷检验及评价的评分",
                                 maxScore: 25,
                                 collapsed: false,
                                 subitems: [
                                     {
                                         id: "defectQual",
                                         title: "管体缺陷检验单位和评价人员的资质",
                                         maxScore: 4,
                                         collapsed: false,
                                         items: [
                                             {
                                                 id: "dq1",
                                                 title: "管体缺陷检验单位和评价人员的资质",
                                                 noHeader: false,
                                                                                          options: [
                                             { id: "dq1a", text: "未进行管体缺陷检验及评价", score: 0 },
                                             { id: "dq1b", text: "检验单位或人员无相应资质", score: 0 },
                                             { id: "dq1c", text: "检验单位或人员具备相应资质", score: 4 }
                                         ],
                                         selected: "dq1c"
                                             }
                                         ]
                                     },
                                     {
                                         id: "defectCycle",
                                         title: "管体缺陷检验及评价周期",
                                         maxScore: 5,
                                         collapsed: false,
                                         items: [
                                             {
                                                 id: "dc1",
                                                 title: "管体缺陷检验及评价周期",
                                                 noHeader: false,
                                                                                          options: [
                                             { id: "dc1a", text: "未进行管体缺陷检验及评价", score: 0 },
                                             { id: "dc1b", text: "管体缺陷检验及评价周期过长，不满足实际需要", score: 1 },
                                             { id: "dc1c", text: "管体缺陷检验及评价周期基本满足实际需要", score: 2 },
                                             { id: "dc1d", text: "管体缺陷检验及评价周期满足实际需要", score: 5 }
                                         ],
                                         selected: "dc1d"
                                             }
                                         ]
                                     },
                                     {
                                         id: "defectResult",
                                         title: "管体缺陷检验及评价结果",
                                         maxScore: 16,
                                         collapsed: false,
                                         items: [
                                             {
                                                 id: "dr1",
                                                 title: "管体缺陷检验及评价结果",
                                                 noHeader: false,
                                                 options: [
                                                     { id: "dr1a", text: "未进行管体缺陷检验及评价", score: 0 },
                                                     { id: "dr1b", text: "管体含有不能通过按照GB/T 19624安全评定的缺陷，则取失效可能性S=100", score: null },
                                                     { id: "dr1c", text: "管体含有能通过按照GB/T 19624安全评定的缺陷", score: 14 },
                                                     { id: "dr1d", text: "管体不含缺陷", score: 16 }
                                                 ],
                                                 selected: "dr1d"
                                             }
                                         ]
                                     }
                                 ]
                             }
                         ]
                     }
                ]
            },
            {
                                 id: "D54",
                                 title: "D.5.4自然灾害及其防范措施的评分",
                maxScore: 15,
                collapsed: true,
                subitems: [

                    {
                        id: "D542",
                        title: "D.5.4.2风载荷及其防范的评分",
                        maxScore: 1,
                        collapsed: false,
                        items: [
                            {
                                id: "wind1",
                                title: "风载荷防范",
                                noHeader: false,
                                options: [
                                    { id: "wind1a", text: "跨越段，跨距/外径>200，且历史最大风力大于等于设计时考虑的风力", score: 0 },
                                    { id: "wind1b", text: "跨越段，跨距/外径∈(100，200]，且历史最大风力大于等于设计考虑的风力", score: 0.5 },
                                    { id: "wind1c", text: "跨越段，跨距/外径∈[30，100]，且历史最大风力大于等于设计时考虑的风力", score: 0.8 },
                                    { id: "wind1d", text: "跨越段，跨距/外径<30，且历史最大风力大于等于设计时考虑的风力", score: 1 },
                                    { id: "wind1e", text: "跨越段，但历史最大风力小于设计时考虑的风力", score: 1 },
                                    { id: "wind1f", text: "非跨越段", score: 1 }
                                ],
                                selected: "wind1f"
                            }
                        ]
                    },
                    {
                        id: "D543",
                        title: "D.5.4.3雪载荷及其防范的评分",
                        maxScore: 1,
                        collapsed: false,
                        items: [
                            {
                                id: "snow1",
                                title: "雪载荷防范",
                                noHeader: false,
                                options: [
                                    { id: "snow1a", text: "跨越段，跨距/外径>200，且历史最大降雪量大于等于设计时考虑的降雪量", score: 0 },
                                    { id: "snow1b", text: "跨越段，跨距/外径∈(100，200]，且历史最大降雪量大于等于设计考虑的降雪量", score: 0.5 },
                                    { id: "snow1c", text: "跨越段，跨距/外径∈[30，100]，且历史最大降雪量大于等于设计时考虑的降雪量", score: 0.8 },
                                    { id: "snow1d", text: "跨越段，跨距/外径<30，且历史最大降雪量大于等于设计时考虑的降雪量", score: 1 },
                                    { id: "snow1e", text: "跨越段，但历史最大降雪量小于设计时考虑的降雪量", score: 1 },
                                    { id: "snow1f", text: "非跨越段", score: 1 }
                                ],
                                selected: "snow1f"
                            }
                        ]
                    },

                                         {
                         id: "D544",
                         title: "D.5.4.4滑坡、泥石流及其防范的评分",
                         maxScore: 6,
                         collapsed: false,
                         subitems: [
                             {
                                 id: "D5452",
                                 title: "D.5.4.2.2年降雨量",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "rainfall1",
                                         title: "年降雨量",
                                         noHeader: false,
                                         options: [
                                             { id: "rf1a", text: "年降雨量>1270mm", score: 0 },
                                             { id: "rf1b", text: "年降雨量∈[305mm，1270mm]", score: 0.5 },
                                             { id: "rf1c", text: "年降雨量<305mm", score: 1 }
                                         ],
                                         selected: "rf1c"
                                     }
                                 ]
                             },
                             {
                                 id: "D5453",
                                 title: "D.5.4.2.3斜坡及穿越评分",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "slope1",
                                         title: "斜坡及穿越",
                                         noHeader: false,
                                         options: [
                                             { id: "sl1a", text: "管道区段所在处的斜坡度数>30度", score: 0 },
                                             { id: "sl1b", text: "管道区段穿越铁路或有10吨以上大卡车经过的公路", score: 0 },
                                             { id: "sl1c", text: "管道区段所在处的斜坡度数∈[10度，30度]", score: 0.5 },
                                             { id: "sl1d", text: "管道区段穿越有10吨以下车辆经过的公路", score: 0.5 },
                                             { id: "sl1e", text: "管道区段所在处的斜坡度数<10度，并且管道区段不穿越公路或铁路", score: 1 }
                                         ],
                                         selected: "sl1e"
                                     }
                                 ]
                             },
                             {
                                 id: "D5454",
                                 title: "D.5.4.2.4排水设施的评分",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "drainage1",
                                         title: "排水设施",
                                         noHeader: false,
                                         options: [
                                             { id: "dr1a", text: "无排水沟，或者在管道区段附近形成积水池，水流直接冲击管道", score: 0 },
                                             { id: "dr1b", text: "有排水沟，但不清理，常堵塞、可能形成水流冲击管道", score: 0.5 },
                                             { id: "dr1c", text: "有排水沟，并且排水沟定期清理，设置合理，不可能形成水流冲击管道", score: 1 }
                                         ],
                                         selected: "dr1c"
                                     }
                                 ]
                             },
                             {
                                 id: "D5455",
                                 title: "D.5.4.2.5滑坡及泥石流预防措施的评分",
                                 maxScore: 2,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "prevention1",
                                         title: "滑坡及泥石流预防措施",
                                         noHeader: false,
                                         options: [
                                             { id: "prev1a", text: "未对滑坡及泥石流地质条件做评价", score: 0 },
                                             { id: "prev1b", text: "在明显滑坡及泥石流地段未设计堡坎", score: 0 },
                                             { id: "prev1c", text: "堡坎的设计强度不足", score: 0.5 },
                                             { id: "prev1d", text: "在明显滑坡及泥石流地段设计有足够强度的堡坎", score: 1 },
                                             { id: "prev1e", text: "在所有可能滑坡及泥石流地段均设计有足够强度的堡坎", score: 2 }
                                         ],
                                         selected: "prev1e"
                                     }
                                 ]
                             }
                         ]
                     },
                     {
                         id: "D545",
                         title: "D.5.4.5地震及其防范的评分",
                         maxScore: 6,
                         collapsed: false,
                         subitems: [
                             {
                                 id: "D5462",
                                 title: "D.5.4.5.2地震断裂带的评分",
                                 maxScore: 2,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "fault1",
                                         title: "地震断裂带",
                                         noHeader: false,
                                         options: [
                                             { id: "f1a", text: "未对地震地质条件做评价", score: 0 },
                                             { id: "f1b", text: "管道区段位于地震断裂带", score: 0 },
                                             { id: "f1c", text: "管道区段不位于地震断裂带", score: 2 }
                                         ],
                                         selected: "f1c"
                                     }
                                 ]
                             },
                             {
                                 id: "D5463",
                                 title: "D.5.4.5.3防震措施的评分",
                                 maxScore: 4,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "seismic1",
                                         title: "防震措施",
                                         noHeader: false,
                                         options: [
                                             { id: "seis1a", text: "未对地震基本烈度评价", score: 0 },
                                             { id: "seis1b", text: "地震烈度不小于相关标准、规范规定的地震基本烈度，并且未采取防震措施", score: 0 },
                                             { id: "seis1c", text: "设防烈度小于地震基本烈度", score: 1 },
                                             { id: "seis1d", text: "设防烈度大于地震基本烈度", score: 3 },
                                             { id: "seis1e", text: "不需要防震", score: 4 }
                                         ],
                                         selected: "seis1e"
                                     }
                                 ]
                             }
                         ]
                     },
                     {
                         id: "D546",
                         title: "D.5.4.6抵御洪水能力的评价",
                         maxScore: 1,
                         collapsed: false,
                         items: [
                             {
                                 id: "floodResist1",
                                 title: "抵御洪水能力",
                                 noHeader: false,
                                 options: [
                                     { id: "fr1a", text: "未考虑抵御洪水", score: 0 },
                                     { id: "fr1b", text: "能抵御20年一遇的洪水", score: 0.5 },
                                     { id: "fr1c", text: "能抵御50年一遇的洪水", score: 0.8 },
                                     { id: "fr1d", text: "能抵御100年或更长时间一遇洪水", score: 1 },
                                     { id: "fr1e", text: "不需要考虑抵御洪水", score: 1 }
                                 ],
                                 selected: "fr1e"
                             }
                         ]
                     },
                     {
                         id: "D547",
                         title: "D.5.4.7土壤移动的评分",
                         maxScore: 3,
                         collapsed: false,
                         subitems: [
                             {
                                 id: "D5472",
                                 title: "D.5.4.6.2土壤类型的评分",
                                 maxScore: 1,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "soilType1",
                                         title: "土壤类型",
                                         noHeader: false,
                                         options: [
                                             { id: "st1a", text: "管道区段所处土壤是黄土、淤泥土、砂土、黏性土、粉质黏土等", score: 0.5 },
                                             { id: "st1b", text: "管道区段所在处土壤是砂岩、泥岩、风化岩壁", score: 1 }
                                         ],
                                         selected: "st1b"
                                     }
                                 ]
                             },
                             {
                                 id: "D5473",
                                 title: "D.5.4.6.3地基土沉降监测的评分",
                                 maxScore: 2,
                                 collapsed: false,
                                 items: [
                                     {
                                         id: "settlement1",
                                         title: "地基土沉降监测",
                                         noHeader: false,
                                         options: [
                                             { id: "set1a", text: "不监测", score: 0 },
                                             { id: "set1b", text: "至少每年监测一次", score: 1 },
                                             { id: "set1c", text: "连续监测", score: 2 },
                                             { id: "set1d", text: "不需要监测", score: 2 }
                                         ],
                                         selected: "set1c"
                                     }
                                 ]
                             }
                         ]
                     },
                     {
                         id: "D548",
                         title: "D.5.4.8其他地质稳定性评分",
                         maxScore: 1,
                         collapsed: false,
                         items: [
                             {
                                 id: "geology1",
                                 title: "其他地质稳定性",
                                 noHeader: false,
                                 options: [
                                     { id: "geo1a", text: "管道区段处容易发生崩塌", score: 0 },
                                     { id: "geo1b", text: "管道区段处曾经发生沉降或位于采矿区", score: 0.5 },
                                     { id: "geo1c", text: "管道区段处位于斜坡段、活断层、液化区等，地质不稳定", score: 0.8 },
                                     { id: "geo1d", text: "管道区段处地质稳定", score: 1 }
                                 ],
                                 selected: "geo1d"
                             }
                         ]
                     },
                     {
                         id: "D549",
                         title: "D.5.4.9自然灾害区域的监测评分",
                         maxScore: 1,
                         collapsed: false,
                         items: [
                             {
                                 id: "monitoring1",
                                 title: "自然灾害区域监测",
                                 noHeader: false,
                                 options: [
                                     { id: "mon1a", text: "不监测", score: 0 },
                                     { id: "mon1b", text: "监测周期大于等于1年", score: 0.2 },
                                     { id: "mon1c", text: "监测周期大于等于半年小于一年", score: 0.5 },
                                     { id: "mon1d", text: "监测周期大于等于1周小于半年", score: 0.8 },
                                     { id: "mon1e", text: "监测周期小于1周", score: 1 },
                                     { id: "mon1f", text: "不需要监测", score: 1 }
                                 ],
                                 selected: "mon1e"
                             }
                         ]
                     }
                 ]
             },
            {
                                                  id: "D55",
                 title: "D.5.5其他评价项的评分",
                 maxScore: 5,
                 collapsed: true,
                subitems: [
                                        {
                        id: "D552",
                        title: "D.5.5.2城市燃气管道其他评价项目的评分",
                        maxScore: 5,
                        collapsed: false,
                        items: [
                            {
                                id: "other1",
                                title: "其他评价项目",
                                noHeader: false,
                                fixedScore: 0,
                                fixedText: "固定得分：0分",
                                hidden: true
                            }
                        ]
                    }
                ]
            }
        ];


        this.renderScoringSystem(container, scoringData, 'safety');
    }
    // 渲染失效后果评分模块 - 完整评分数据
    renderFailureConsequenceModule(container) {
        const scoringData = [
            {
                id: "E2",
                title: "E.2 介质短期危害性评分",
                maxScore: 32,
                collapsed: false,
                type: "tabs",
                tabs: [
                    {
                        id: "tab_natural_gas",
                        title: "天然气",
                        icon: "🛢️",
                        active: true,
                        content: {
                            id: "E22_natural_gas",
                            title: "天然气介质短期危害性评分",
                            maxScore: 32,
                            subitems: [
                                {
                                    id: "E22_natural_gas",
                                    title: "E.2.2 介质燃烧性的评分",
                                    maxScore: 12,
                                    collapsed: false,
                                    items: [
                                        {
                                            id: "combust1_natural_gas",
                                            title: "介质燃烧性",
                                            options: [
                                                { id: "combust1a_natural_gas", text: "介质不可燃", score: 0 },
                                                { id: "combust1b_natural_gas", text: "介质可燃，介质闪点大于93度", score: 3 },
                                                { id: "combust1c_natural_gas", text: "介质可燃，介质闪点大于38度小于等于93度", score: 6 },
                                                { id: "combust1d_natural_gas", text: "介质可燃，介质闪点小于等于38度，并且介质沸点小于等于38度", score: 9 },
                                                { id: "combust1e_natural_gas", text: "介质可燃，介质闪点小于等于23度，并且介质沸点小于等于38度", score: 12 }
                                            ],
                                            selected: "combust1e_natural_gas",
                                            fixed: true,
                                            locked: true
                                        }
                                    ]
                                },
                                {
                                    id: "E23_natural_gas",
                                    title: "E.2.3 介质反应性的评分",
                                    maxScore: 12,
                                    collapsed: false,
                                    subitems: [
                                        {
                                            id: "E232_natural_gas",
                                            title: "E.2.3.2 低放热值的峰值温度的评分",
                                            maxScore: 8,
                                            collapsed: false,
                                            items: [
                                                {
                                                    id: "temp1_natural_gas",
                                                    title: "峰值温度",
                                                    options: [
                                                        { id: "temp1a_natural_gas", text: "峰值温度大于400度", score: 0 },
                                                        { id: "temp1b_natural_gas", text: "峰值温度大于305度，小于等于400度", score: 2 },
                                                        { id: "temp1c_natural_gas", text: "峰值温度大于215度，小于等于305度", score: 4 },
                                                        { id: "temp1d_natural_gas", text: "峰值温度大于125度，小于等于215度", score: 6 },
                                                        { id: "temp1e_natural_gas", text: "峰值温度小于等于125度", score: 8 }
                                                    ],
                                                    selected: "temp1e_natural_gas",
                                                    fixed: true,
                                                    locked: true
                                                }
                                            ]
                                        },
                                        {
                                            id: "E233_natural_gas",
                                            title: "E.2.3.3 最高工作压力的评分",
                                            maxScore: 4,
                                            collapsed: false,
                                            items: [
                                                {
                                                    id: "pressure1_natural_gas",
                                                    title: "最高工作压力",
                                                    options: [
                                                        { id: "pressure1a_natural_gas", text: "小于等于0.34MPa", score: 0 },
                                                        { id: "pressure1b_natural_gas", text: "大于0.34MPa小于等于1.36MPa", score: 2 },
                                                        { id: "pressure1c_natural_gas", text: "大于1.36MPa", score: 4 }
                                                    ],
                                                    selected: "pressure1a_natural_gas"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    id: "E24_natural_gas",
                                    title: "E.2.4 介质毒性的评分",
                                    maxScore: 12,
                                    collapsed: false,
                                    items: [
                                        {
                                            id: "toxicity1_natural_gas",
                                            title: "介质毒性",
                                            options: [
                                                { id: "toxicity1a_natural_gas", text: "无毒性", score: 0 },
                                                { id: "toxicity1b_natural_gas", text: "轻度危害毒性", score: 4 },
                                                { id: "toxicity1c_natural_gas", text: "中度危害毒性", score: 8 },
                                                { id: "toxicity1d_natural_gas", text: "高度危害毒性", score: 10 },
                                                { id: "toxicity1e_natural_gas", text: "极度危害毒性", score: 12 }
                                            ],
                                            selected: "toxicity1b_natural_gas",
                                            fixed: true,
                                            locked: true
                                        }
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        id: "tab_non_natural_gas",
                        title: "非天然气",
                        icon: "🧪",
                        active: false,
                        content: {
                            id: "E22_non_natural_gas",
                            title: "非天然气介质短期危害性评分",
                            maxScore: 32,
                            subitems: [
                                {
                                    id: "E22_non_natural_gas",
                                    title: "E.2.2 介质燃烧性的评分",
                                    maxScore: 12,
                                    collapsed: false,
                                    items: [
                                        {
                                            id: "combust1_non_natural_gas",
                                            title: "介质燃烧性",
                                            options: [
                                                { id: "combust1a_non_natural_gas", text: "介质不可燃", score: 0 },
                                                { id: "combust1b_non_natural_gas", text: "介质可燃，介质闪点大于93度", score: 3 },
                                                { id: "combust1c_non_natural_gas", text: "介质可燃，介质闪点大于38度小于等于93度", score: 6 },
                                                { id: "combust1d_non_natural_gas", text: "介质可燃，介质闪点小于等于38度，并且介质沸点小于等于38度", score: 9 },
                                                { id: "combust1e_non_natural_gas", text: "介质可燃，介质闪点小于等于23度，并且介质沸点小于等于38度", score: 12 }
                                            ],
                                            selected: "combust1a_non_natural_gas"
                                        }
                                    ]
                                },
                                {
                                    id: "E23_non_natural_gas",
                                    title: "E.2.3 介质反应性的评分",
                                    maxScore: 12,
                                    collapsed: false,
                                    subitems: [
                                        {
                                            id: "E232_non_natural_gas",
                                            title: "E.2.3.2 低放热值的峰值温度的评分",
                                            maxScore: 8,
                                            collapsed: false,
                                            items: [
                                                {
                                                    id: "temp1_non_natural_gas",
                                                    title: "峰值温度",
                                                    options: [
                                                        { id: "temp1a_non_natural_gas", text: "峰值温度大于400度", score: 0 },
                                                        { id: "temp1b_non_natural_gas", text: "峰值温度大于305度，小于等于400度", score: 2 },
                                                        { id: "temp1c_non_natural_gas", text: "峰值温度大于215度，小于等于305度", score: 4 },
                                                        { id: "temp1d_non_natural_gas", text: "峰值温度大于125度，小于等于215度", score: 6 },
                                                        { id: "temp1e_non_natural_gas", text: "峰值温度小于等于125度", score: 8 }
                                                    ],
                                                    selected: "temp1a_non_natural_gas"
                                                }
                                            ]
                                        },
                                        {
                                            id: "E233_non_natural_gas",
                                            title: "E.2.3.3 最高工作压力的评分",
                                            maxScore: 4,
                                            collapsed: false,
                                            items: [
                                                {
                                                    id: "pressure1_non_natural_gas",
                                                    title: "最高工作压力",
                                                    options: [
                                                        { id: "pressure1a_non_natural_gas", text: "小于等于0.34MPa", score: 0 },
                                                        { id: "pressure1b_non_natural_gas", text: "大于0.34MPa小于等于1.36MPa", score: 2 },
                                                        { id: "pressure1c_non_natural_gas", text: "大于1.36MPa", score: 4 }
                                                    ],
                                                    selected: "pressure1a_non_natural_gas"
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    id: "E24_non_natural_gas",
                                    title: "E.2.4 介质毒性的评分",
                                    maxScore: 12,
                                    collapsed: false,
                                    items: [
                                        {
                                            id: "toxicity1_non_natural_gas",
                                            title: "介质毒性",
                                            options: [
                                                { id: "toxicity1a_non_natural_gas", text: "无毒性", score: 0 },
                                                { id: "toxicity1b_non_natural_gas", text: "轻度危害毒性", score: 4 },
                                                { id: "toxicity1c_non_natural_gas", text: "中度危害毒性", score: 8 },
                                                { id: "toxicity1d_non_natural_gas", text: "高度危害毒性", score: 10 },
                                                { id: "toxicity1e_non_natural_gas", text: "极度危害毒性", score: 12 }
                                            ],
                                            selected: "toxicity1a_non_natural_gas"
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            },
            {
                id: "E3",
                title: "E.3 介质最大泄漏量的评分",
                maxScore: 20,
                collapsed: false,
                items: [
                    {
                        id: "leakage1",
                        title: "介质最大泄漏量",
                        options: [
                            { id: "leakage1_1", text: "最大泄漏量小于等于450kg", score: 1 },
                            { id: "leakage1_8", text: "大于450kg，小于等于4500kg", score: 8 },
                            { id: "leakage1_12", text: "大于4500kg，小于等于45000kg", score: 12 },
                            { id: "leakage1_16", text: "大于45000kg，小于等于450000kg", score: 16 },
                            { id: "leakage1_20", text: "大于450000kg", score: 20 }
                        ],
                        selected: "leakage1_1",
                        showCalculator: true,
                        description: "评分标准：≤450kg得1分，450-4500kg得8分，4500-45000kg得12分，45000-450000kg得16分，>450000kg得20分"
                    }
                ]
            },
            {
                id: "E4",
                title: "E.4 介质扩散性评分",
                maxScore: 15,
                collapsed: false,
                subitems: [
                    {
                        id: "E43",
                        title: "E.4.3 气体介质扩散性评分",
                        maxScore: 15,
                        collapsed: false,
                        subitems: [
                            {
                                id: "E432",
                                title: "E.4.3.2 地形评分",
                                maxScore: 6,
                                collapsed: false,
                                items: [
                                    {
                                        id: "terrain1",
                                        title: "地形评分",
                                        options: [
                                            { id: "terrain1a", text: "可能的泄漏处地形闭塞", score: 1 },
                                            { id: "terrain1b", text: "可能的泄漏处地形开阔", score: 6 }
                                        ],
                                        selected: "terrain1a"
                                    }
                                ]
                            },
                            {
                                id: "E433",
                                title: "E.4.3.3 风速的评分",
                                maxScore: 9,
                                collapsed: false,
                                items: [
                                    {
                                        id: "wind1",
                                        title: "风速评分",
                                        options: [
                                            { id: "wind1a", text: "可能的泄漏处年平均风速低", score: 2 },
                                            { id: "wind1b", text: "可能的泄漏处年平均风速中等", score: 6 },
                                            { id: "wind1c", text: "可能的泄漏处年平均风速高", score: 9 }
                                        ],
                                        selected: "wind1a"
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: "E5",
                title: "E.5 人口密度的评分",
                maxScore: 20,
                collapsed: false,
                items: [
                    {
                        id: "population1",
                        title: "人口密度",
                        options: [
                            { id: "pop1a", text: "可能的泄漏处是荒芜人烟地区", score: 0 },
                            { id: "pop1b", text: "可能的泄漏处2km长度范围内，管道区段两侧各200m的范围内，人口数量大于等于1，小于100", score: 6 },
                            { id: "pop1c", text: "可能的泄漏处2km长度范围内，管道区段两侧各200m的范围内，人口数量大于等于100，小于300", score: 12 },
                            { id: "pop1d", text: "可能的泄漏处2km长度范围内，管道区段两侧各200m的范围内，人口数量大于等于300，小于500", score: 16 },
                            { id: "pop1e", text: "可能的泄漏处2km长度范围内，管道区段两侧各200m的范围内，人口数量大于500", score: 20 }
                        ],
                        selected: null
                    }
                ]
            },
            {
                id: "E6",
                title: "E.6 沿线环境（财产密度）评分",
                maxScore: 15,
                collapsed: false,
                items: [
                    {
                        id: "property1",
                        title: "沿线环境",
                        options: [
                            { id: "prop1a", text: "可能的泄漏处荒无人烟地区", score: 0 },
                            { id: "prop1b", text: "可能的泄漏处2km长度范围内，管道区段两侧各200m的范围内，大多为农业生产区", score: 3 },
                            { id: "prop1c", text: "可能的泄漏处2km长度范围内，管道区段两侧各200m的范围内，大多为住宅、宾馆、娱乐休闲地", score: 6 },
                            { id: "prop1d", text: "可能的泄漏处2km长度范围内，管道区段两侧各200m的范围内，大多为商业区", score: 9 },
                            { id: "prop1e", text: "可能的泄漏处2km长度范围内，管道区段两侧各200m的范围内，大多为仓库、码头、车站等", score: 12 },
                            { id: "prop1f", text: "可能的泄漏处2km长度范围内，管道区段两侧各200m的范围内，多为工业生产区", score: 15 }
                        ],
                        selected: null
                    }
                ]
            },
            {
                id: "E7",
                title: "E.7 泄漏原因的评分",
                maxScore: 8,
                collapsed: false,
                items: [
                    {
                        id: "leakageCause1",
                        title: "泄漏原因",
                        options: [
                            { id: "cause1a", text: "最可能的泄漏原因是操作失误", score: 1 },
                            { id: "cause1b", text: "最可能的泄漏原因是焊接质量或腐蚀穿孔", score: 5 },
                            { id: "cause1c", text: "最可能的泄漏原因是第三方破坏或自然灾害", score: 8 }
                        ],
                        selected: null
                    }
                ]
            },
            {
                id: "E8",
                title: "E.8 供应中断对下游用户的影响评分",
                maxScore: 36,
                collapsed: false,
                subitems: [
                    {
                        id: "E82",
                        title: "E.8.2 抢修时间的评分",
                        maxScore: 9,
                        collapsed: false,
                        items: [
                            {
                                id: "repairTime1",
                                title: "抢修时间",
                                options: [
                                    { id: "time1a", text: "抢修时间小于1天", score: 1 },
                                    { id: "time1b", text: "抢修时间大于等于1天，小于2天", score: 3 },
                                    { id: "time1c", text: "抢修时间大于等于2天，小于4天", score: 5 },
                                    { id: "time1d", text: "抢修时间大于等于4天，小于7天", score: 7 },
                                    { id: "time1e", text: "抢修时间大于等于7天", score: 9 }
                                ],
                                selected: null
                            }
                        ]
                    },
                    {
                        id: "E83",
                        title: "E.8.3 供应中断的影响范围和程度的评分",
                        maxScore: 15,
                        collapsed: false,
                        items: [
                            {
                                id: "impact1",
                                title: "影响范围和程度",
                                options: [
                                    { id: "impact1a", text: "无重要用户，供应中断对其他单位影响一般", score: 3 },
                                    { id: "impact1b", text: "供应中断影响小城市，小城镇的工业用燃料", score: 6 },
                                    { id: "impact1c", text: "供应中断影响小企业、小城市生活", score: 9 },
                                    { id: "impact1d", text: "供应中断影响一般的工业生产，中型城市生活", score: 12 },
                                    { id: "impact1e", text: "供应中断影响国家重要大型企业，大型中心城市的生产、生活", score: 15 }
                                ],
                                selected: null
                            }
                        ]
                    },
                    {
                        id: "E84",
                        title: "E.8.4 用户对管道所输送介质的依赖性的评分",
                        maxScore: 12,
                        collapsed: false,
                        items: [
                            {
                                id: "dependency1",
                                title: "用户依赖性",
                                options: [
                                    { id: "dep1a", text: "供应中断的影响很小", score: 3 },
                                    { id: "dep1b", text: "有代替介质可用", score: 6 },
                                    { id: "dep1c", text: "有自备储存设施", score: 9 },
                                    { id: "dep1d", text: "用户对管道所输送介质绝对依赖", score: 12 }
                                ],
                                selected: null
                            }
                        ]
                    }
                ]
            }
        ];

        this.renderScoringSystem(container, scoringData, 'consequence');
    }   
    // 渲染评分系统
    renderScoringSystem(container, scoringData, moduleId) {
        container.innerHTML = '';
        
        const scoringSystem = document.createElement('div');
        scoringSystem.className = 'scoring-system';
        
        scoringData.forEach(section => {
            const sectionElement = this.createSectionElement(section, moduleId);
            scoringSystem.appendChild(sectionElement);
        });
        
        // 不添加控制按钮
        
        container.appendChild(scoringSystem);
    }

    // 创建评分部分元素
    createSectionElement(section, moduleId) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'scoring-section';
        
        // 检查是否应该禁用整个部分
        if (section.disabled) {
            sectionDiv.style.opacity = '0.5';
            sectionDiv.style.pointerEvents = 'none';
            sectionDiv.classList.add('disabled-section');
        }
        
        const sectionTitle = document.createElement('button');
        sectionTitle.className = 'section-title';
        sectionTitle.innerHTML = `
            <span><i class="fas fa-chevron-right"></i> ${section.title}</span>
            <div class="section-buttons">
                <button class="section-reset-btn" data-section-id="${section.id}" data-module-id="${moduleId}" title="重置此评分项">重置</button>
                <span class="section-score">得分: 0</span>
            </div>
        `;
        
        const sectionContent = document.createElement('div');
        // 检查是否应该折叠
        if (section.collapsed) {
            sectionContent.className = 'section-content collapsed';
        } else {
            sectionContent.className = 'section-content';
        }
        
        // 检查是否是选项卡类型
        console.log('检查section类型:', section.type, section.title);
        if (section.type === "tabs") {
            console.log('创建选项卡元素:', section.title);
            const tabsElement = this.createTabsElement(section, moduleId);
            sectionContent.appendChild(tabsElement);
        } else if (section.type === "conditional") {
            console.log('创建条件选择元素:', section.title);
            const conditionalElement = this.createConditionalElement(section, moduleId);
            sectionContent.appendChild(conditionalElement);
        } else {
            // 渲染子项
            if (section.subitems) {
                section.subitems.forEach(subitem => {
                    const subitemElement = this.createSubitemElement(subitem, moduleId);
                    sectionContent.appendChild(subitemElement);
                });
            }
            
            // 渲染直接项目
            if (section.items) {
                section.items.forEach(item => {
                    const itemElement = this.createItemElement(item, moduleId);
                    sectionContent.appendChild(itemElement);
                });
            }
        }
        
        sectionDiv.appendChild(sectionTitle);
        sectionDiv.appendChild(sectionContent);
        
        return sectionDiv;
    }



    // 创建选项卡元素
    createTabsElement(section, moduleId) {
        console.log('创建选项卡元素:', section, moduleId);
        
        const tabsDiv = document.createElement('div');
        tabsDiv.className = 'tabs-container';
        tabsDiv.dataset.moduleId = moduleId;
        
        // 创建选项卡标题栏
        const tabsHeader = document.createElement('div');
        tabsHeader.className = 'tabs-header';
        
        section.tabs.forEach((tab, index) => {
            console.log('创建选项卡按钮:', tab.title, tab.active);
            const tabButton = document.createElement('button');
            tabButton.className = `tab-button ${tab.active ? 'active' : ''}`;
            tabButton.innerHTML = `<span class="tab-icon">${tab.icon}</span>${tab.title}`;
            tabButton.addEventListener('click', () => {
                this.switchTab(tabsDiv, index, section, moduleId);
            });
            tabsHeader.appendChild(tabButton);
        });
        
        tabsDiv.appendChild(tabsHeader);
        
        // 创建选项卡内容
        const tabsContent = document.createElement('div');
        tabsContent.className = 'tabs-content';
        
        section.tabs.forEach((tab, index) => {
            console.log('创建选项卡内容:', tab.title, tab.active);
            const tabContent = document.createElement('div');
            tabContent.className = `tab-content ${tab.active ? 'active' : ''}`;
            tabContent.id = `tab-content-${moduleId}-${index}`;
            
            // 渲染选项卡内容
            if (tab.content.subitems) {
                tab.content.subitems.forEach(subitem => {
                    const subitemElement = this.createSubitemElement(subitem, moduleId);
                    tabContent.appendChild(subitemElement);
                });
            }
            
            if (tab.content.items) {
                tab.content.items.forEach(item => {
                    const itemElement = this.createItemElement(item, moduleId);
                    tabContent.appendChild(itemElement);
                });
            }
            
            tabsContent.appendChild(tabContent);
        });
        
        tabsDiv.appendChild(tabsContent);
        
        console.log('选项卡元素创建完成:', tabsDiv);
        return tabsDiv;
    }

    // 创建条件选择元素
    createConditionalElement(section, moduleId) {
        console.log('创建条件选择元素:', section, moduleId);
        
        const conditionalDiv = document.createElement('div');
        conditionalDiv.className = 'conditional-container';
        conditionalDiv.dataset.moduleId = moduleId;
        
        // 渲染初始选择器
        if (section.items) {
            section.items.forEach(item => {
                if (item.conditional) {
                    const selectorElement = this.createItemElement(item, moduleId);
                    conditionalDiv.appendChild(selectorElement);
                    
                    // 添加条件内容容器
                    const conditionalContent = document.createElement('div');
                    conditionalContent.className = 'conditional-content';
                    conditionalContent.id = `conditional-content-${moduleId}`;
                    conditionalContent.style.display = 'none'; // 初始隐藏
                    
                    conditionalDiv.appendChild(conditionalContent);
                    
                    // 监听选择器变化
                    const select = selectorElement.querySelector('select');
                    if (select) {
                        select.addEventListener('change', (e) => {
                            this.handleConditionalSelection(e.target.value, section, conditionalContent, moduleId);
                        });
                    }
                }
            });
        }
        
        console.log('条件选择元素创建完成:', conditionalDiv);
        return conditionalDiv;
    }

    // 处理条件选择
    handleConditionalSelection(selectedValue, section, contentContainer, moduleId) {
        console.log('处理条件选择:', selectedValue, moduleId);
        
        // 清空当前内容
        contentContainer.innerHTML = '';
        
        // 如果选择为空或"请选择"，隐藏内容
        if (!selectedValue || selectedValue === '') {
            contentContainer.style.display = 'none';
            console.log('选择了"请选择"，隐藏内容');
            return;
        }
        
        if (selectedValue && section.conditionalContent && section.conditionalContent[selectedValue]) {
            const selectedContent = section.conditionalContent[selectedValue];
            
            // 渲染选中的内容
            if (selectedContent.subitems) {
                selectedContent.subitems.forEach(subitem => {
                    const subitemElement = this.createSubitemElement(subitem, moduleId);
                    contentContainer.appendChild(subitemElement);
                });
            }
            
            if (selectedContent.items) {
                selectedContent.items.forEach(item => {
                    const itemElement = this.createItemElement(item, moduleId);
                    contentContainer.appendChild(itemElement);
                });
            }
            
            // 显示内容
            contentContainer.style.display = 'block';
            
            // 更新分数
            setTimeout(() => {
                this.updateSectionScores(moduleId);
            }, 0);
        } else {
            // 隐藏内容
            contentContainer.style.display = 'none';
        }
    }

    // 切换选项卡
    switchTab(tabsContainer, activeIndex, section, moduleId) {
        // 更新选项卡按钮状态
        const tabButtons = tabsContainer.querySelectorAll('.tab-button');
        tabButtons.forEach((button, index) => {
            button.classList.toggle('active', index === activeIndex);
        });
        
        // 更新选项卡内容状态
        const tabContents = tabsContainer.querySelectorAll('.tab-content');
        tabContents.forEach((content, index) => {
            content.classList.toggle('active', index === activeIndex);
        });
        
        // 更新section状态
        section.tabs.forEach((tab, index) => {
            tab.active = index === activeIndex;
        });
        
        // 重置非激活选项卡为0分
        this.resetInactiveTabScores(section, moduleId, activeIndex);
        
        // 设置激活选项卡的默认值
        this.setActiveTabDefaults(section, moduleId, activeIndex);
        
        // 延迟刷新分数显示，确保默认值设置完成
        setTimeout(() => {
            this.updateSectionScores(moduleId);
            this.updateModuleScore(moduleId);
        }, 100);
    }

    // 重置非激活选项卡的评分为0
    resetInactiveTabScores(section, moduleId, activeIndex) {
        section.tabs.forEach((tab, index) => {
            if (index === activeIndex) return;

            const isUnderwater = tab.id === 'tab2' || /水下/.test(tab.title || '');

            const resetOptionItem = (item) => {
                if (item.options) {
                    // 尊重数据结构中已设置的selected属性，如果没有则使用默认逻辑
                    let targetOption;
                    if (item.selected) {
                        // 如果已经有selected属性，使用它
                        targetOption = item.options.find(opt => opt.id === item.selected);
                    } else if (isUnderwater) {
                        // 水下穿越：恢复到默认最高值（排除score为null）
                        targetOption = item.options
                            .filter(opt => opt.score !== null && opt.score !== undefined)
                            .reduce((best, opt) => (best === null || opt.score > best.score) ? opt : best, null);
                    } else {
                        // 非水下：恢复到默认最低/0分
                        targetOption = item.options
                            .filter(opt => opt.score !== null && opt.score !== undefined)
                            .reduce((low, opt) => (low === null || opt.score < low.score) ? opt : low, null);
                    }
                    
                    if (targetOption) {
                        item.selected = targetOption.id;
                        // 在失效后果模块中查找元素时，确保在正确的模块容器中查找
                        const moduleContainer = document.querySelector(`#module-${moduleId}`);
                        if (moduleContainer) {
                            const selectEl = moduleContainer.querySelector(`select[data-item-id="${item.id}"]`);
                            if (selectEl) selectEl.value = targetOption.id;
                        }
                    }

                    // 清空分数记录
                    if (this.scores[moduleId] && this.scores[moduleId][item.id]) {
                        delete this.scores[moduleId][item.id];
                    }
                } else if (item.inputType === 'number') {
                    const defaultVal = isUnderwater ? (typeof item.defaultValue === 'number' ? item.defaultValue : 0) : 0;
                    const moduleContainer = document.querySelector(`#module-${moduleId}`);
                    if (moduleContainer) {
                        const inputElement = moduleContainer.querySelector(`[data-item-id="${item.id}"] input`);
                        if (inputElement) inputElement.value = defaultVal;
                    }
                    item.defaultValue = defaultVal;

                    if (this.scores[moduleId] && this.scores[moduleId][item.id]) {
                        delete this.scores[moduleId][item.id];
                    }
                }
            };

            if (tab.content.subitems) {
                tab.content.subitems.forEach(subitem => {
                    if (!subitem.items) return;
                    subitem.items.forEach(resetOptionItem);
                });
            }
            if (tab.content.items) {
                tab.content.items.forEach(resetOptionItem);
            }
        });
    }

    // 设置激活选项卡的默认值
    setActiveTabDefaults(section, moduleId, activeIndex) {
        const activeTab = section.tabs[activeIndex];
        
        // 清空当前模块的所有分数记录
        if (this.scores[moduleId]) {
            this.scores[moduleId] = {};
        }
        
        // 特殊处理失效后果模块的天然气选项卡
        if (moduleId === 'consequence' && activeTab.id === 'tab_natural_gas') {
            console.log('切换到天然气选项卡，恢复固定选项的默认值...');
            // 延迟执行，确保DOM更新完成
            setTimeout(() => {
                this.restoreNaturalGasTabDefaults();
            }, 50);
            return;
        }
        
        // 特殊处理失效后果模块的非天然气选项卡
        if (moduleId === 'consequence' && activeTab.id === 'tab_non_natural_gas') {
            console.log('切换到非天然气选项卡，设置最低值选项为默认值...');
            // 延迟执行，确保DOM更新完成
            setTimeout(() => {
                this.setNonNaturalGasTabDefaults();
            }, 50);
            return;
        }
        
        if (activeTab.content.subitems) {
            activeTab.content.subitems.forEach(subitem => {
                if (subitem.items) {
                    subitem.items.forEach(item => {
                        if (item.options && !item.selected) {
                            // 设置最高分选项
                            const highestScoreOption = item.options.reduce((highest, option) => 
                                option.score > highest.score ? option : highest
                            );
                            item.selected = highestScoreOption.id;
                        }
                        
                        // 记录激活选项卡的分数
                        if (item.options && item.selected) {
                            const selectedOption = item.options.find(opt => opt.id === item.selected);
                            if (selectedOption && selectedOption.score !== null) {
                                this.scores[moduleId][item.id] = selectedOption.score;
                            }
                        }
                    });
                }
            });
        }
        
        if (activeTab.content.items) {
            activeTab.content.items.forEach(item => {
                if (item.options && !item.selected) {
                    // 设置最高分选项
                    const highestScoreOption = item.options.reduce((highest, option) => 
                        option.score > highest.score ? highest : option
                    );
                    item.selected = highestScoreOption.id;
                }
                
                // 记录激活选项卡的分数
                if (item.options && item.selected) {
                    const selectedOption = item.options.find(opt => opt.id === item.selected);
                    if (selectedOption && selectedOption.score !== null) {
                        this.scores[moduleId][item.id] = selectedOption.score;
                    }
                } else if (item.inputType === "number") {
                    // 记录数字输入的分数
                    const inputElement = document.querySelector(`[data-item-id="${item.id}"] input`);
                    if (inputElement) {
                        // 特殊处理D.2.3.3埋深评分：确保输入框显示正确的placeholder
                        if (item.id === "depth1b") {
                            // 如果输入框为空或值为默认值0，重置为正确的placeholder状态
                            if (!inputElement.value || inputElement.value === "0") {
                                inputElement.value = '';
                                inputElement.placeholder = '请输入0-8之间的数值，根据实际埋深评分';
                                this.scores[moduleId][item.id] = 0;
                            } else {
                                const value = parseFloat(inputElement.value) || 0;
                                this.scores[moduleId][item.id] = value;
                            }
                        } else {
                            const value = parseFloat(inputElement.value) || 0;
                            this.scores[moduleId][item.id] = value;
                        }
                    }
                }
            });
        }
        
        // 强制更新DOM
        setTimeout(() => {
            this.updateModuleScore(moduleId);
        }, 100);
    }

    // 确保天然气选项卡中的固定选项正确显示默认值
    ensureNaturalGasTabDefaults() {
        console.log('确保天然气选项卡中的固定选项正确显示默认值...');
        
        // 查找失效后果模块中的天然气选项卡
        const consequenceModule = document.querySelector('#module-consequence');
        if (!consequenceModule) {
            console.log('未找到失效后果模块，延迟执行...');
            // 如果模块还没有渲染，延迟执行
            setTimeout(() => this.ensureNaturalGasTabDefaults(), 100);
            return;
        }
        
        // 查找天然气选项卡中需要设置默认值的选项
        const fixedItems = [
            { id: 'combust1_natural_gas', expectedValue: 'combust1e_natural_gas', description: '介质燃烧性' },
            { id: 'temp1_natural_gas', expectedValue: 'temp1e_natural_gas', description: '峰值温度' },
            { id: 'pressure1_natural_gas', expectedValue: 'pressure1a_natural_gas', description: '最高工作压力' },
            { id: 'toxicity1_natural_gas', expectedValue: 'toxicity1b_natural_gas', description: '介质毒性' }
        ];
        
        fixedItems.forEach(item => {
            const select = consequenceModule.querySelector(`[data-item-id="${item.id}"]`);
            if (select) {
                // 确保选择器显示正确的默认值
                if (select.value !== item.expectedValue) {
                    select.value = item.expectedValue;
                    
                    // 强制触发change事件，确保DOM更新
                    const event = new Event('change', { bubbles: true });
                    select.dispatchEvent(event);
                    
                    console.log(`已设置 ${item.description} 的默认值: ${item.expectedValue}`);
                }
                
                // 确保分数被正确计算和保存
                const selectedOption = select.options[select.selectedIndex];
                if (selectedOption) {
                    // 从选项的text中提取分数
                    const scoreMatch = selectedOption.text.match(/\((\d+)分\)/);
                    if (scoreMatch) {
                        const score = parseInt(scoreMatch[1]);
                        if (!this.scores.consequence) {
                            this.scores.consequence = {};
                        }
                        this.scores.consequence[item.id] = score;
                        console.log(`已保存 ${item.description} 的分数: ${score}`);
                    }
                }
            } else {
                console.log(`未找到 ${item.description} 的选择器`);
            }
        });
        
        // 更新失效后果模块的分数显示
        this.updateModuleScore('consequence');
        console.log('天然气选项卡固定选项默认值设置完成');
        
        // 调试：检查失效后果模块的分数计算
        this.debugConsequenceModuleScore();
    }

    // 恢复天然气选项卡中固定选项的默认值
    restoreNaturalGasTabDefaults() {
        console.log('恢复天然气选项卡中固定选项的默认值...');
        
        // 查找失效后果模块中的天然气选项卡
        const consequenceModule = document.querySelector('#module-consequence');
        if (!consequenceModule) {
            console.log('未找到失效后果模块');
            return;
        }
        
        // 天然气选项卡中需要恢复默认值的选项
        const fixedItems = [
            { id: 'combust1_natural_gas', expectedValue: 'combust1e_natural_gas', description: '介质燃烧性', score: 12 },
            { id: 'temp1_natural_gas', expectedValue: 'temp1e_natural_gas', description: '峰值温度', score: 8 },
            { id: 'pressure1_natural_gas', expectedValue: 'pressure1a_natural_gas', description: '最高工作压力', score: 0 },
            { id: 'toxicity1_natural_gas', expectedValue: 'toxicity1b_natural_gas', description: '介质毒性', score: 4 }
        ];
        
        fixedItems.forEach(item => {
            const select = consequenceModule.querySelector(`[data-item-id="${item.id}"]`);
            if (select) {
                // 强制设置选择器为默认值
                select.value = item.expectedValue;
                
                // 强制触发change事件，确保DOM更新
                const event = new Event('change', { bubbles: true });
                select.dispatchEvent(event);
                
                console.log(`已恢复 ${item.description} 的默认值: ${item.expectedValue}`);
                
                // 保存到scores对象中
                if (!this.scores.consequence) {
                    this.scores.consequence = {};
                }
                this.scores.consequence[item.id] = item.score;
                console.log(`已保存 ${item.description} 的分数: ${item.score}`);
            } else {
                console.log(`未找到 ${item.description} 的选择器`);
            }
        });
        
        // 更新失效后果模块的分数显示
        this.updateModuleScore('consequence');
        console.log('天然气选项卡固定选项默认值恢复完成');
    }

    // 设置非天然气选项卡中所有选项的最低值作为默认值
    setNonNaturalGasTabDefaults() {
        console.log('设置非天然气选项卡中所有选项的最低值作为默认值...');
        
        // 查找失效后果模块中的非天然气选项卡
        const consequenceModule = document.querySelector('#module-consequence');
        if (!consequenceModule) {
            console.log('未找到失效后果模块');
            return;
        }
        
        // 非天然气选项卡中所有选项的最低值默认值
        const lowestValueItems = [
            { id: 'combust1_non_natural_gas', expectedValue: 'combust1a_non_natural_gas', description: '介质燃烧性', score: 0 },
            { id: 'temp1_non_natural_gas', expectedValue: 'temp1a_non_natural_gas', description: '峰值温度', score: 0 },
            { id: 'pressure1_non_natural_gas', expectedValue: 'pressure1a_non_natural_gas', description: '最高工作压力', score: 0 },
            { id: 'toxicity1_non_natural_gas', expectedValue: 'toxicity1a_non_natural_gas', description: '介质毒性', score: 0 }
        ];
        
        lowestValueItems.forEach(item => {
            const select = consequenceModule.querySelector(`[data-item-id="${item.id}"]`);
            if (select) {
                // 强制设置选择器为最低值选项
                select.value = item.expectedValue;
                
                // 强制触发change事件，确保DOM更新
                const event = new Event('change', { bubbles: true });
                select.dispatchEvent(event);
                
                console.log(`已设置 ${item.description} 的最低值默认值: ${item.expectedValue}`);
                
                // 保存到scores对象中
                if (!this.scores.consequence) {
                    this.scores.consequence = {};
                }
                this.scores.consequence[item.id] = item.score;
                console.log(`已保存 ${item.description} 的分数: ${item.score}`);
            } else {
                console.log(`未找到 ${item.description} 的选择器`);
            }
        });
        
        // 更新失效后果模块的分数显示
        this.updateModuleScore('consequence');
        console.log('非天然气选项卡最低值默认值设置完成');
    }

    // 强制加载失效后果模块并设置默认值
    forceLoadConsequenceModuleAndSetDefaults() {
        console.log('强制加载失效后果模块并设置默认值...');
        
        // 强制加载失效后果模块
        this.loadModule('consequence');
        
        // 延迟设置默认值，确保模块完全渲染
        setTimeout(() => {
            console.log('失效后果模块加载完成，开始设置默认值...');
            this.ensureNaturalGasTabDefaults();
        }, 500);
        
        // 不再强制跳转回第三方破坏模块，让用户自由选择要访问的模块
        console.log('失效后果模块默认值设置完成，用户可自由选择要访问的模块');
    }

    // 在后台静默设置失效后果模块的默认值，不影响用户界面
    silentlySetConsequenceDefaults() {
        console.log('在后台静默设置失效后果模块的默认值...');
        
        // 不切换模块，直接在数据层面设置默认值
        // 这样可以避免DOM渲染冲突，确保第三方破坏模块正常显示
        
        // 延迟设置默认值，确保所有模块都已渲染
        setTimeout(() => {
            console.log('开始设置失效后果模块的默认值...');
            
            // 直接调用设置函数，不切换模块
            this.ensureNaturalGasTabDefaults();
            
            console.log('失效后果模块默认值设置完成，未影响当前模块显示');
        }, 500);
    }

    // 保存选项卡选择到localStorage
    saveTabSelection(moduleId, activeIndex) {
        const key = `tab_selection_${moduleId}`;
        localStorage.setItem(key, activeIndex.toString());
    }

    // 从localStorage加载选项卡选择
    loadTabSelection(moduleId) {
        const key = `tab_selection_${moduleId}`;
        const savedIndex = localStorage.getItem(key);
        return savedIndex ? parseInt(savedIndex) : null;
    }

    // 创建子项元素
    createSubitemElement(subitem, moduleId) {
        const subitemDiv = document.createElement('div');
        subitemDiv.className = 'subitem';
        
        // 检查是否应该禁用整个子项
        if (subitem.disabled) {
            subitemDiv.style.opacity = '0.5';
            subitemDiv.style.pointerEvents = 'none';
            subitemDiv.classList.add('disabled-subitem');
        }
        
        const subitemTitle = document.createElement('h3');
        subitemTitle.className = 'subitem-title';
        subitemTitle.textContent = subitem.title;
        
        subitemDiv.appendChild(subitemTitle);
        
        // 渲染更深层的子项（递归处理多层嵌套）
        if (subitem.subitems) {
            subitem.subitems.forEach(nestedSubitem => {
                const nestedSubitemElement = this.createSubitemElement(nestedSubitem, moduleId);
                subitemDiv.appendChild(nestedSubitemElement);
            });
        }
        
        // 渲染项目
        if (subitem.items) {
            subitem.items.forEach(item => {
                const itemElement = this.createItemElement(item, moduleId);
                subitemDiv.appendChild(itemElement);
            });
        }
        
        return subitemDiv;
    }

    // 创建项目元素
    createItemElement(item, moduleId) {
        // 如果项目设置为隐藏，仍然保存分数但不渲染UI
        if (item.hidden) {
            // 保存固定分数到scores对象
            if (!this.scores[moduleId]) {
                this.scores[moduleId] = {};
            }
            this.scores[moduleId][item.id] = item.fixedScore || 0;
            
            // 返回一个空的不可见元素
            const hiddenDiv = document.createElement('div');
            hiddenDiv.style.display = 'none';
            return hiddenDiv;
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = 'scoring-item';
        
        const itemHeader = document.createElement('div');
        itemHeader.className = 'item-header';
        itemHeader.innerHTML = `<span class="item-title">${item.title}</span>`;
        
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'options-container';
        
        // 检查是否有输入框类型
        if (item.inputType === "number") {
            // 创建数字输入框
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'option-input';
            input.id = `${moduleId}-${item.id}`;
            input.name = `${moduleId}-${item.id}`;
            input.setAttribute('data-item-id', item.id);
            input.setAttribute('data-module-id', moduleId);
            input.min = item.minValue || 0;
            input.max = item.maxValue || 100;
            input.step = item.step || 1;
            input.placeholder = item.placeholder || '请输入数值';
            input.value = item.defaultValue || '';
            
            // 保存输入值到scores对象
            if (!this.scores[moduleId]) {
                this.scores[moduleId] = {};
            }
            this.scores[moduleId][item.id] = parseFloat(item.defaultValue) || 0;
            
            optionsContainer.appendChild(input);
            
            // 如果有计算器按钮，添加在输入框右上角
            if (item.showCalculator && (item.id === 'depth1b' || item.id === 'safetyMargin1' || item.id === 'strength1')) {
                const calcBtn = document.createElement('button');
                calcBtn.type = 'button';
                calcBtn.className = 'calculator-btn';
                calcBtn.textContent = '去计算';
                // 检测是否为移动端
                const isMobile = window.innerWidth <= 768;
                
                if (isMobile) {
                    calcBtn.style.cssText = `
                        position: absolute;
                        top: -45px;
                        right: 5px;
                        padding: 2px 4px;
                        font-size: 9px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 2px;
                        cursor: pointer;
                        z-index: 20;
                        white-space: nowrap;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        transform: scale(0.9);
                        -webkit-tap-highlight-color: transparent;
                        -webkit-user-select: none;
                        outline: none;
                    `;
                } else {
                    calcBtn.style.cssText = `
                        position: absolute;
                        top: -35px;
                        right: 0px;
                        padding: 4px 8px;
                        font-size: 12px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                        z-index: 10;
                        white-space: nowrap;
                        -webkit-tap-highlight-color: transparent;
                        -webkit-user-select: none;
                        outline: none;
                    `;
                }
                
                calcBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (item.id === 'depth1b') {
                        this.createDepthCalculator();
                    } else if (item.id === 'safetyMargin1') {
                        this.createSafetyMarginCalculator();
                    } else if (item.id === 'strength1') {
                        this.createStrengthCalculator();
                    }
                });
                
                // 确保选项容器有相对定位
                optionsContainer.style.position = 'relative';
                optionsContainer.appendChild(calcBtn);
                
                // 添加窗口大小变化监听器，动态调整按钮位置
                const adjustButtonPosition = () => {
                    const isMobile = window.innerWidth <= 768;
                    if (isMobile) {
                        calcBtn.style.top = '-45px';
                        calcBtn.style.right = '5px';
                        calcBtn.style.fontSize = '9px';
                        calcBtn.style.padding = '2px 4px';
                        calcBtn.style.background = '#007bff';
                        calcBtn.style.zIndex = '20';
                        calcBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                        calcBtn.style.borderRadius = '2px';
                        calcBtn.style.transform = 'scale(0.9)';
                    } else {
                        calcBtn.style.top = '-35px';
                        calcBtn.style.right = '0px';
                        calcBtn.style.fontSize = '12px';
                        calcBtn.style.padding = '4px 8px';
                        calcBtn.style.background = '#007bff';
                        calcBtn.style.zIndex = '10';
                        calcBtn.style.boxShadow = 'none';
                        calcBtn.style.borderRadius = '3px';
                        calcBtn.style.transform = 'none';
                    }
                };
                
                window.addEventListener('resize', adjustButtonPosition);
            }
            
            // 确保输入框在页面加载时处于可用状态
            if (item.id === "depth1b") {
                input.disabled = false;
                input.style.opacity = '1';
                input.style.cursor = 'text';
                // 允许小数分值，避免因 step 导致 :invalid 变红
                input.step = 'any';
            }
            
            
            // 强度试验已改为下拉选项 + 隐藏输入，不再直接绑定输入框点击事件
            
            // 为埋地段输入框添加基本输入限制（只限制非数字字符）
            if (item.id === "depth1b") {
                input.addEventListener('keydown', (e) => {
                    // 允许删除键、退格键、Tab键、Enter键、方向键等控制键
                    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' || 
                        e.key === 'Enter' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
                        e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Home' || 
                        e.key === 'End' || (e.ctrlKey && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x'))) {
                        return;
                    }
                    
                    // 只允许数字、小数点和负号
                    if (!/[0-9.-]/.test(e.key)) {
                        e.preventDefault();
                        return;
                    }
                });
            }
            
            // 添加输入验证和事件处理
            input.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                    // 检查D.5.2.5附加安全裕度的范围验证 - 注释掉早期验证，让后面的特殊处理来处理
                    // if (this.isAdditionalSafetyMarginField(input)) {
                    //     // 使用专门的验证函数
                    //     if (!this.validateSafetyMarginScore(value)) {
                    //         // 验证失败时不显示提示框，只记录日志
                    //         if (value < 0) {
                    //             console.log(`D.5.2.5附加安全裕度分值为负数(${value})，将被忽略，不计入总分`);
                    //         } else if (value > item.maxValue) {
                    //             console.log(`D.5.2.5附加安全裕度分值超出范围(${value})，最大值应为${item.maxValue}`);
                    //         } else {
                    //             console.log(`D.5.2.5附加安全裕度分值无效(${value})`);
                    //         }
                    //         return;
                    //     } else {
                    //         input.setCustomValidity('');
                    //     }
                    // }
                    
                    // 特殊处理埋地段输入框：限制0-8分范围
                    if (item.id === "depth1b") {
                        // 验证范围0-8分
                        if (value < 0 || value > 8) {
                            // 设置输入框为淡红色边框 - 使用多种方式确保样式生效
                            input.style.setProperty('border', '2px solid #f87171', 'important');
                            input.style.setProperty('border-color', '#f87171', 'important');
                            input.style.setProperty('border-width', '2px', 'important');
                            input.style.setProperty('box-shadow', '0 0 0 0.2rem rgba(248, 113, 113, 0.15)', 'important');
                            input.style.setProperty('outline', 'none', 'important');
                            input.setCustomValidity('请输入0-8之间的数值');
                            input.classList.add('invalid-input');
                            
                            console.log('设置红色边框样式，当前输入值:', value);
                            
                            // 创建或更新提示信息
                            let tooltip = input.parentElement.querySelector('.validation-tooltip');
                            if (!tooltip) {
                                tooltip = document.createElement('div');
                                tooltip.className = 'validation-tooltip';
                                tooltip.style.cssText = `
                                    position: absolute;
                                    top: 100%;
                                    left: 0;
                                    background: #f87171;
                                    color: white;
                                    padding: 4px 8px;
                                    border-radius: 3px;
                                    font-size: 12px;
                                    white-space: nowrap;
                                    z-index: 1000;
                                    margin-top: 2px;
                                `;
                                input.parentElement.appendChild(tooltip);
                            }
                            tooltip.textContent = `输入值 ${value} 超出范围，请输入0-8之间的数值`;
                            tooltip.style.display = 'block';
                            
                            // 不保存超出范围的值
                            return;
                        }
                        
                        // 范围内的值直接保存
                        this.scores[moduleId][item.id] = value;
                        console.log(`埋地段分值 ${value} 已保存到scores对象`);
                        
                        // 清除验证错误状态
                        input.setCustomValidity('');
                        input.style.removeProperty('border');
                        input.style.removeProperty('border-color');
                        input.style.removeProperty('border-width');
                        input.style.removeProperty('box-shadow');
                        input.style.removeProperty('outline');
                        input.classList.remove('invalid-input');
                        
                        console.log('清除红色边框样式，当前输入值:', value);
                        
                        // 隐藏提示信息
                        const tooltip = input.parentElement.querySelector('.validation-tooltip');
                        if (tooltip) {
                            tooltip.style.display = 'none';
                        }
                        
                        input.step = 'any';
                    } else if (this.isAdditionalSafetyMarginField(input)) {
                        // 特殊处理D.5.2.5附加安全裕度
                        console.log(`检测到附加安全裕度输入，值=${value}, ID=${input.id}, data-item-id=${input.getAttribute('data-item-id')}`);
                        if (value < 0) {
                            // 负值：失效可能性为100
                            console.log(`D.5.2.5附加安全裕度分值为负数(${value})，失效可能性为100`);
                            
                            // 保存负值到scores对象（用于S=100状态判断），但在分数计算时会被忽略
                            this.scores[moduleId][item.id] = value;
                            console.log(`保存负数的附加安全裕度分值${value}到scores对象（用于S=100状态判断）`);
                            
                            // 显示S=100提示
                            this.showSafetyMarginWarning();
                            
                            // 清除红色边框（因为负值是有效的，只是表示S=100）
                            input.style.removeProperty('border');
                            input.style.removeProperty('border-color');
                            input.style.removeProperty('border-width');
                            input.style.removeProperty('box-shadow');
                            input.style.removeProperty('outline');
                            input.setCustomValidity('');
                            
                            // 隐藏提示信息
                            const tooltip = input.parentElement.querySelector('.validation-tooltip');
                            if (tooltip) {
                                tooltip.style.display = 'none';
                            }
                        } else if (value > 2) {
                            // 大于2：显示红色边框和提示
                            console.log(`附加安全裕度值${value}大于2，设置红色边框和提示`);
                            input.style.setProperty('border', '2px solid #f87171', 'important');
                            input.style.setProperty('border-color', '#f87171', 'important');
                            input.style.setProperty('border-width', '2px', 'important');
                            input.style.setProperty('box-shadow', '0 0 0 0.2rem rgba(248, 113, 113, 0.15)', 'important');
                            input.style.setProperty('outline', 'none', 'important');
                            input.setCustomValidity('附加安全裕度应不大于2');
                            
                            // 创建或更新提示信息
                            let tooltip = input.parentElement.querySelector('.validation-tooltip');
                            if (!tooltip) {
                                tooltip = document.createElement('div');
                                tooltip.className = 'validation-tooltip';
                                tooltip.style.cssText = `
                                    position: absolute;
                                    top: 100%;
                                    left: 0;
                                    background: #f87171;
                                    color: white;
                                    padding: 4px 8px;
                                    border-radius: 3px;
                                    font-size: 12px;
                                    white-space: nowrap;
                                    z-index: 1000;
                                    margin-top: 2px;
                                `;
                                input.parentElement.appendChild(tooltip);
                            }
                            tooltip.textContent = `输入值 ${value} 超出范围，附加安全裕度应不大于2`;
                            tooltip.style.display = 'block';
                            
                            // 不保存超出范围的值
                            return;
                        } else {
                            // 0-2范围内的有效值
                            this.scores[moduleId][item.id] = value;
                            console.log(`附加安全裕度分值 ${value} 已保存到scores对象`);
                            
                            // 清除验证错误状态
                            input.setCustomValidity('');
                            input.style.removeProperty('border');
                            input.style.removeProperty('border-color');
                            input.style.removeProperty('border-width');
                            input.style.removeProperty('box-shadow');
                            input.style.removeProperty('outline');
                            
                            // 隐藏提示信息
                            const tooltip = input.parentElement.querySelector('.validation-tooltip');
                            if (tooltip) {
                                tooltip.style.display = 'none';
                            }
                        }
                    } else if (item.id === 'strength1') {
                        // 特殊处理D.5.2.4.9强度试验输入框：限制0-3分范围
                        if (value < 0 || value > 3) {
                            // 设置输入框为淡红色边框
                            input.style.setProperty('border', '2px solid #f87171', 'important');
                            input.style.setProperty('border-color', '#f87171', 'important');
                            input.style.setProperty('border-width', '2px', 'important');
                            input.style.setProperty('box-shadow', '0 0 0 0.2rem rgba(248, 113, 113, 0.15)', 'important');
                            input.style.setProperty('outline', 'none', 'important');
                            input.setCustomValidity('强度试验分值应在0-3分范围内');
                            
                            // 创建或更新提示信息
                            let tooltip = input.parentElement.querySelector('.validation-tooltip');
                            if (!tooltip) {
                                tooltip = document.createElement('div');
                                tooltip.className = 'validation-tooltip';
                                tooltip.style.cssText = `
                                    position: absolute;
                                    top: 100%;
                                    left: 0;
                                    background: #f87171;
                                    color: white;
                                    padding: 4px 8px;
                                    border-radius: 3px;
                                    font-size: 12px;
                                    white-space: nowrap;
                                    z-index: 1000;
                                    margin-top: 2px;
                                `;
                                input.parentElement.appendChild(tooltip);
                            }
                            tooltip.textContent = `输入值 ${value} 超出范围，强度试验分值应在0-3分范围内`;
                            tooltip.style.display = 'block';
                            
                            console.log(`强度试验分值${value}超出0-3分范围，显示红色边框和提示`);
                            // 不保存超出范围的值
                            return;
                        } else {
                            // 0-3范围内的有效值
                            this.scores[moduleId][item.id] = value;
                            console.log(`强度试验分值 ${value} 已保存到scores对象`);
                            
                            // 清除验证错误状态
                            input.setCustomValidity('');
                            input.style.removeProperty('border');
                            input.style.removeProperty('border-color');
                            input.style.removeProperty('border-width');
                            input.style.removeProperty('box-shadow');
                            input.style.removeProperty('outline');
                            
                            // 隐藏提示信息
                            const tooltip = input.parentElement.querySelector('.validation-tooltip');
                            if (tooltip) {
                                tooltip.style.display = 'none';
                            }
                        }
                    } else {
                        // 保存其他输入框的值
                        this.scores[moduleId][item.id] = value;
                        console.log(`输入框分值 ${value} 已保存到scores对象`);
                    }
                    

                    
                    // 延迟触发分数更新，避免频繁更新
                    clearTimeout(this.updateScoreTimeout);
                    this.updateScoreTimeout = setTimeout(() => {
                        this.updateSectionScores(moduleId);
                        this.updateModuleScore(moduleId);
                    }, 100);
                }
            });
            
            // 如果有描述信息，显示在输入框下方
            if (item.description) {
                const descriptionDiv = document.createElement('div');
                descriptionDiv.className = 'item-description';
                descriptionDiv.textContent = item.description;
                optionsContainer.appendChild(descriptionDiv);
            }
        } else if (item.fixedScore !== undefined) {
            // 固定分数项目，显示固定文本
            const fixedDiv = document.createElement('div');
            fixedDiv.className = 'fixed-score-item';
            fixedDiv.style.cssText = `
                padding: 8px 12px;
                background-color: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 4px;
                color: #6c757d;
                font-weight: 500;
            `;
            fixedDiv.textContent = item.fixedText || `固定得分：${item.fixedScore}分`;
            
            optionsContainer.appendChild(fixedDiv);
            
            // 保存固定分数到scores对象
            if (!this.scores[moduleId]) {
                this.scores[moduleId] = {};
            }
            this.scores[moduleId][item.id] = item.fixedScore;
        } else if (item.options && item.options.length > 0) {
            // 正常的下拉框选项
            const select = document.createElement('select');
            select.className = 'option-select';
            select.id = `${moduleId}-${item.id}`;
            select.name = `${moduleId}-${item.id}`;
            select.setAttribute('data-item-id', item.id);
            select.setAttribute('data-module-id', moduleId);
            select.innerHTML = '';
            
            item.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.id;
                
                // 如果分数为null或undefined，则不显示分数
                if (option.score === null || option.score === undefined) {
                    optionElement.textContent = option.text;
                } else {
                    optionElement.textContent = `${option.text} (${option.score}分)`;
                }
                
                optionElement.dataset.score = option.score;
                select.appendChild(optionElement);
            });

            // 特例：强度试验已改为输入框，跳过旧的下拉选择器逻辑
            if (false && item.id === 'strength1') {
                // 创建隐藏输入框以承载计算结果，参与分数统计
                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'number';
                hiddenInput.className = 'option-input';
                hiddenInput.id = 'safety-strength1';
                hiddenInput.style.display = 'none';
                hiddenInput.step = 'any';
                hiddenInput.placeholder = '强度试验计算结果';
                // 清空初值，未选择“参照附件”则不计分
                hiddenInput.value = '';
                // 确保参与模块与小节分数统计
                hiddenInput.setAttribute('data-item-id', 'strength1');
                hiddenInput.setAttribute('data-module-id', moduleId);

                // 当选择“参照附件”时，打开计算器
                select.addEventListener('change', (e) => {
                    const val = e.target.value;
                    // 恢复“参照附件”原始文本（移除上次的分数标注）
                    const cOption = Array.from(select.options).find(o => o.value === 'strength1c');
                    if (cOption) {
                        if (!cOption.dataset.baseText) {
                            cOption.dataset.baseText = cOption.textContent;
                        }
                        cOption.textContent = cOption.dataset.baseText;
                    }
                    if (val === 'strength1c') {
                        this.createStrengthCalculator();
                    } else {
                        hiddenInput.value = '';
                        setTimeout(() => this.updateSectionScores(moduleId), 0);
                    }
                });

                optionsContainer.appendChild(select);
                optionsContainer.appendChild(hiddenInput);
            } else {
                optionsContainer.appendChild(select);
            }
            
            // 如果有计算器按钮，添加在下拉框上方右侧
            if (item.showCalculator && (item.id === 'leakage1' || item.id === 'depth1b')) {
                const calcBtn = document.createElement('button');
                calcBtn.type = 'button';
                calcBtn.className = 'calculator-btn';
                calcBtn.textContent = '去计算';
                // 检测是否为移动端
                const isMobile = window.innerWidth <= 768;
                
                if (isMobile) {
                    calcBtn.style.cssText = `
                        position: absolute;
                        top: -45px;
                        right: 5px;
                        padding: 2px 4px;
                        font-size: 9px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 2px;
                        cursor: pointer;
                        z-index: 20;
                        white-space: nowrap;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        transform: scale(0.9);
                        -webkit-tap-highlight-color: transparent;
                        -webkit-user-select: none;
                        outline: none;
                    `;
                } else {
                    calcBtn.style.cssText = `
                        position: absolute;
                        top: -35px;
                        right: 0px;
                        padding: 4px 8px;
                        font-size: 12px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                        z-index: 10;
                        white-space: nowrap;
                        -webkit-tap-highlight-color: transparent;
                        -webkit-user-select: none;
                        outline: none;
                    `;
                }
                
                calcBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (item.id === 'leakage1') {
                        this.openLeakageCalculator(select || optionsContainer.querySelector('select'));
                    } else if (item.id === 'depth1b') {
                        this.createDepthCalculator();
                    }
                });
                
                // 确保选项容器有相对定位
                optionsContainer.style.position = 'relative';
                optionsContainer.appendChild(calcBtn);
                
                // 添加窗口大小变化监听器，动态调整按钮位置
                const adjustButtonPosition = () => {
                    const isMobile = window.innerWidth <= 768;
                    if (isMobile) {
                        calcBtn.style.top = '-45px';
                        calcBtn.style.right = '5px';
                        calcBtn.style.fontSize = '9px';
                        calcBtn.style.padding = '2px 4px';
                        calcBtn.style.background = '#007bff';
                        calcBtn.style.zIndex = '20';
                        calcBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                        calcBtn.style.borderRadius = '2px';
                        calcBtn.style.transform = 'scale(0.9)';
                    } else {
                        calcBtn.style.top = '-35px';
                        calcBtn.style.right = '0px';
                        calcBtn.style.fontSize = '12px';
                        calcBtn.style.padding = '4px 8px';
                        calcBtn.style.background = '#007bff';
                        calcBtn.style.zIndex = '10';
                        calcBtn.style.boxShadow = 'none';
                        calcBtn.style.borderRadius = '3px';
                        calcBtn.style.transform = 'none';
                    }
                };
                
                window.addEventListener('resize', adjustButtonPosition);
            }
            
            // 如果选项被固定，添加事件监听器来阻止更改
            if (item.fixed) {
                // 添加data-fixed属性用于CSS样式
                select.setAttribute('data-fixed', 'true');
                
                // 如果选项被锁定，设置为禁用状态
                if (item.locked) {
                    select.disabled = true;
                    select.style.backgroundColor = '#f3f4f6';
                    select.style.color = '#6c757d';
                    select.style.cursor = 'not-allowed';
                    select.style.opacity = '0.7';
                }
                
                // 确保固定选项的分数被正确计算
                const selectedOption = select.options[select.selectedIndex];
                if (selectedOption && selectedOption.dataset.score) {
                    const score = parseFloat(selectedOption.dataset.score);
                    if (!isNaN(score)) {
                        // 保存到scores对象中
                        if (!this.scores[moduleId]) {
                            this.scores[moduleId] = {};
                        }
                        this.scores[moduleId][item.id] = item.selected;
                        console.log(`固定选项 ${item.id} 已设置，分数: ${score}`);
                    }
                }
                
                // 只阻止change事件，允许下拉框打开但阻止选择更改
                select.addEventListener('change', (e) => {
                    // 延迟恢复选择，避免闪烁
                    requestAnimationFrame(() => {
                        select.value = item.selected;
                    });
                });
                
                // 如果是固定选项，立即更新分数显示
                this.updateSectionScores(moduleId);
            }
        }
        
        // 处理输入框以外的情况，确保有选择器被添加
        if (!item.inputType && (!item.options || item.options.length === 0)) {
            // 如果没有输入框也没有选项，创建一个空的提示
            const noOptionsDiv = document.createElement('div');
            noOptionsDiv.textContent = '暂无可选项目';
            noOptionsDiv.style.cssText = 'padding: 8px; color: #666; font-style: italic;';
            optionsContainer.appendChild(noOptionsDiv);
        }
        
        // 自动选择默认值选项（仅对非输入框类型）
        if (!item.inputType && item.options && item.options.length > 0) {
            // 找到对应的select元素
            const select = optionsContainer.querySelector('.option-select');
            
            // 检查是否有预选的选项（包括禁用的选项）
            if (item.selected && select) {
                select.value = item.selected;
                
                // 保存到scores对象中
                if (!this.scores[moduleId]) {
                    this.scores[moduleId] = {};
                }
                this.scores[moduleId][item.id] = item.selected;
                
                console.log(`选项 ${item.id} 已预选: ${item.selected}`);
                
                // 对于埋深相关项目，立即更新分数显示
                const isDepthRelated = (
                    item.id === "depth1a" || item.id === "depth2a" || item.id === "depth3a" || item.id === "depth4a"
                );
                if (isDepthRelated) {
                    setTimeout(() => {
                        this.updateSectionScores(moduleId);
                    }, 50);
                }
            } else {
                // 过滤掉不参与评分的选项（分数为null），然后选择默认选项
                const validOptions = item.options.filter(option => option.score !== null);
                
                if (validOptions.length > 0) {
                    let defaultOption;
                    
                    // 为大气腐蚀的特定选项设置特殊默认值
                    if (item.id === "atm1") {
                        // 埋地段大气腐蚀默认选择10分选项
                        defaultOption = validOptions.find(option => option.score === 10) || validOptions[0];
                    } else if (item.id === "pos1" || item.id === "struct1" || item.id === "corrosion1" || 
                              item.id === "app1" || item.id === "quality1" || item.id === "inspection1" || 
                              item.id === "repair1") {
                        // 跨越段的选项默认选择最低分（通常是0分）
                        defaultOption = validOptions.reduce((lowest, current) => {
                            return (current.score < lowest.score) ? current : lowest;
                        });
                    } else {
                        // 其他选项使用最低分值
                        defaultOption = validOptions.reduce((lowest, current) => {
                            return (current.score < lowest.score) ? current : lowest;
                        });
                    }
                    
                    // 设置默认选择（如果有默认选项的话）
                    if (defaultOption && select) {
                        select.value = defaultOption.id;
                        
                        // 保存到scores对象中
                        if (!this.scores[moduleId]) {
                            this.scores[moduleId] = {};
                        }
                        this.scores[moduleId][item.id] = defaultOption.id;
                    }
                }
            }
            
            // 初始化阶段不对大气腐蚀相关项目派发change事件，避免触发互斥
            // 但对于埋深相关项目，如果已经预选了选项，则需要触发change事件来更新分数
            const isAtmosphericCorrosion = (
                item.id === "atm1" || item.id === "pos1" || item.id === "struct1" ||
                item.id === "corrosion1" || item.id === "app1" || item.id === "quality1" ||
                item.id === "inspection1" || item.id === "repair1"
            );
            
            if (!isAtmosphericCorrosion) {
                // 对于埋深相关项目，如果已经预选，则触发change事件
                const isDepthRelated = (
                    item.id === "depth1a" || item.id === "depth2a" || item.id === "depth3a" || item.id === "depth4a"
                );
                
                if (isDepthRelated && item.selected) {
                    // 埋深相关项目已预选，触发change事件更新分数
                    setTimeout(() => {
                        select.dispatchEvent(new Event('change'));
                    }, 100);
                } else if (!isDepthRelated) {
                    // 非埋深相关项目，正常触发change事件
                    setTimeout(() => {
                        select.dispatchEvent(new Event('change'));
                    }, 100);
                }
            }
        }
        
        // 恢复之前的选择状态（如果有的话，仅对非输入框类型）
        if (!item.inputType && this.scores[moduleId] && this.scores[moduleId][item.id]) {
            const select = optionsContainer.querySelector('.option-select');
            if (select) {
                select.value = this.scores[moduleId][item.id];
            }
        }
        
        // 如果是附加安全裕度：清理无效值，允许直接输入
        if (item.id === "safetyMargin1") {
            setTimeout(() => {
                this.cleanupInvalidSafetyMarginScore();
            }, 200);
            const smInput = optionsContainer.querySelector('input.option-input');
            if (smInput) {
                smInput.step = 'any';
                // 移除点击跳出计算器的事件，允许直接输入
                smInput.style.cursor = 'text';
                smInput.title = '请输入附加安全裕度分值';
                
                // 若之前为S=100文本状态，点击时恢复为number，便于重新输入
                smInput.addEventListener('focus', () => {
                    if (smInput.dataset.s100 === 'true') {
                        smInput.type = 'number';
                        smInput.value = '';
                        smInput.dataset.s100 = '';
                    }
                });
            }
        }
        
        // 为特殊选项添加确认提示（仅对非输入框类型）
        if (!item.inputType && (item.id === "wqual1" || item.id === "dr1")) {
            const select = optionsContainer.querySelector('.option-select');
            if (select) {
                select.addEventListener('change', (e) => {
                    const selectedOption = e.target.options[e.target.selectedIndex];
                    if (selectedOption && selectedOption.dataset.score === 'null') {
                        // 直接执行确认操作，不显示确认对话框
                        this.executeSpecialOptionConfirmation(e.target, selectedOption);
                    }
                });
            }
        }
        
        // 为大气腐蚀的互斥选项添加逻辑（仅对非输入框类型）
        if (!item.inputType && item.id === "atm1") {
            const select = optionsContainer.querySelector('.option-select');
            if (select) {
                select.addEventListener('change', (e) => {
                    this.handleAtmosphericCorrosionChange(e.target, 'atm1');
                });
            }
        }
        
        // 为跨越段大气腐蚀的选项添加互斥逻辑（仅对非输入框类型）
        if (!item.inputType && (item.id === "pos1" || item.id === "struct1" || item.id === "corrosion1" || 
            item.id === "app1" || item.id === "quality1" || item.id === "inspection1" || 
                            item.id === "repair1")) {
            const select = optionsContainer.querySelector('.option-select');
            if (select) {
                select.addEventListener('change', (e) => {
                    this.handleAtmosphericCorrosionChange(e.target, 'crossing');
                });
            }
        }
        

        

        
        itemDiv.appendChild(itemHeader);
        itemDiv.appendChild(optionsContainer);
        
        // 强制设置埋深相关选项的初始值（如果已预选）
        if (!item.inputType && item.options && item.options.length > 0) {
            const select = optionsContainer.querySelector('.option-select');
            if (select && item.selected) {
                // 强制设置选项值
                select.value = item.selected;
                
                // 确保scores对象中有正确的值
                if (!this.scores[moduleId]) {
                    this.scores[moduleId] = {};
                }
                this.scores[moduleId][item.id] = item.selected;
                
                console.log(`强制设置选项 ${item.id} 为: ${item.selected}`);
                
                // 对于埋深相关项目，立即更新分数显示
                const isDepthRelated = (
                    item.id === "depth1a" || item.id === "depth2a" || item.id === "depth3a" || item.id === "depth4a"
                );
                if (isDepthRelated) {
                    // 延迟更新分数，确保DOM已完全渲染
                    setTimeout(() => {
                        this.updateSectionScores(moduleId);
                        console.log(`埋深选项 ${item.id} 分数已更新`);
                    }, 100);
                }
            }
        }
        
        return itemDiv;
    }

    // 添加控制按钮
    addControlButtons(container, moduleId) {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'controls';
        
        const resetButton = document.createElement('button');
        resetButton.className = 'btn btn-danger';
        resetButton.textContent = '重置评分';
        resetButton.addEventListener('click', () => this.resetModuleScores(moduleId));
        
        const calculateButton = document.createElement('button');
        calculateButton.className = 'btn btn-success';
        calculateButton.textContent = '计算模块总分';
        calculateButton.addEventListener('click', () => this.calculateModuleScore(moduleId));
        
        controlsDiv.appendChild(resetButton);
        controlsDiv.appendChild(calculateButton);
        container.appendChild(controlsDiv);
    }
    // 重置模块分数
    resetModuleScores(moduleId) {
        const module = document.getElementById(`module-${moduleId}`);
        if (!module) return;
        
        const selects = module.querySelectorAll('.option-select');
        selects.forEach(select => {
            select.value = '';
        });
        
        // 如果是第三方破坏模块，启用所有埋深评分选项 - 已移除，现在使用条件选择方式
        
        // 如果是腐蚀模块，启用所有大气腐蚀评分选项 - 已移除，现在使用条件选择方式
        
        this.scores[moduleId] = 0;
        this.updateSectionScores(moduleId);
        
        // 更新导航栏分数显示
        this.updateNavigationScore(moduleId, 0);
        
        this.showNotification('评分已重置', 'success');
    }

    // 计算模块分数
    calculateModuleScore(moduleId) {
        const module = document.getElementById(`module-${moduleId}`);
        if (!module) return;
        
        const totalScore = this.calculateModuleTotalScore(moduleId);
        console.log(`模块 ${moduleId} 计算出的总分: ${totalScore}`);
        this.scores[moduleId] = totalScore;
        
        this.showModuleScoreResult(moduleId, totalScore);
    }

    // 显示模块分数结果
    showModuleScoreResult(moduleId, totalScore) {
        const moduleNames = {
            'third_party': '第三方破坏',
            'corrosion': '腐蚀',
            'equipment': '设备及操作',
            'safety': '管道本质安全',
            'consequence': '失效后果'
        };
        
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${moduleNames[moduleId]}评分结果</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="score-display">${totalScore}</div>
                    <p>模块总分: ${totalScore}分</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定关闭事件
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // 关闭右上角Toast：保留方法但不展示任何内容
    showToast(message, type = 'info') {
        return; // 不再显示右上角提示
    }

    setupCalculateButton() {
        const calculateBtn = document.querySelector('.calculate-btn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateFinalRisk());
        }
    }

    calculateFinalRisk() {
        // 检查是否有未选择的选项
        const incompleteModules = this.checkIncompleteModules();
        
        if (incompleteModules.length > 0) {
            // 显示提示框
            this.showIncompleteWarning(incompleteModules);
            return;
        }
        
        const resultsSection = document.querySelector('.results-section');
        if (!resultsSection) return;
        
        resultsSection.classList.add('show');
        
        const scoreList = resultsSection.querySelector('.score-list');
        const finalScore = resultsSection.querySelector('.final-score');
        
        if (!scoreList || !finalScore) return;
        
        scoreList.innerHTML = '';
        
        Object.keys(this.scores).forEach(moduleId => {
            let moduleScore = this.calculateModuleTotalScore(moduleId);
            
            // 检查系统是否被锁定
            const isAnyLocked = this.isAnyModuleLocked();
            const isConsequenceModule = moduleId === 'consequence';
            
            // 如果系统被锁定且不是失效后果模块，分数计为0
            if (isAnyLocked && !isConsequenceModule) {
                moduleScore = 0;
            }
            
            this.scores[moduleId] = moduleScore;
            
            const moduleNames = {
                'third_party': '第三方破坏',
                'corrosion': '腐蚀',
                'equipment': '设备及操作',
                'safety': '管道本质安全',
                'consequence': '失效后果'
            };
            
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="result-item-label">${moduleNames[moduleId]}</span>
                <span class="result-item-value">${moduleScore}分</span>
            `;
            scoreList.appendChild(li);
        });
        
        // 检查是否选择了失效可能性S=100的特殊选项
        console.log('计算前检查safety模块scores:', this.scores.safety);
        const specialOptions = this.checkSpecialOptionsForFailureProbability();
        
        console.log('在calculateFinalRisk中检查到的特殊选项:', specialOptions);
        
        let S, failureReason = '';
        if (specialOptions.length > 0) {
            // 如果选择了特殊选项，失效可能性S直接为100
            S = 100;
            failureReason = `因为选择了${specialOptions.join('、')}，所以失效可能性S直接为100`;
            console.log('使用特殊选项，失效可能性S = 100，原因:', failureReason);
        } else {
            // 正常计算失效可能性S
            S = 100 - (0.3 * this.scores.third_party + 0.3 * this.scores.corrosion + 0.1 * this.scores.equipment + 0.3 * this.scores.safety);
            console.log('使用正常计算，失效可能性S =', S);
        }
        
        const C = this.scores.consequence;
        const R = S * C;
        
        const riskLevel = this.classifyRisk(R);
        
        console.log('准备设置finalScore.innerHTML，failureReason:', failureReason);
        console.log('failureReason长度:', failureReason.length);
        
        // 如果S直接为100，添加详细的说明文字
        let explanationHtml = '';
        if (specialOptions.length > 0) {
            explanationHtml = `
                <div style="margin-top: 16px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; color: #92400e; font-size: 14px; line-height: 1.5;">
                    <strong style="color: #78350f;">特别说明：</strong><br>
                    因为选择了以下高风险选项，所以失效可能性S直接为100：<br>
                    ${specialOptions.map((option, index) => {
                        const highlightKeys = [
                            'D.5.2.4.7焊接及其检验的评分焊接质量中的焊缝含有不能通过GB/T 19624进行的安全评定的缺陷，取失效可能性S直接为100',
                            'D.5.3.4.4管体缺陷检验及评价的评分管体缺陷检验及评价结果中的管体含有不能通过按照GB/T 19624安全评定的缺陷，则取失效可能性S直接为100',
                            'D.5.2.5附加安全裕度小于0，失效可能性S=100'
                        ];
                        const shouldHighlight = highlightKeys.some(key => option.includes(key));
                        const text = `${index + 1}. ${option}`;
                        return shouldHighlight ? `<span style=\"color: #dc2626;\">${text}</span>` : text;
                    }).join('<br>')}
                </div>
            `;
        }

        // 正常计算时，仅呈现“失效可能性S”的代入计算过程（不显示说明文字）
        let sFormulaHtml = '';
        if (specialOptions.length === 0) {
            const tp = Number(this.scores.third_party || 0);
            const co = Number(this.scores.corrosion || 0);
            const eq = Number(this.scores.equipment || 0);
            const sa = Number(this.scores.safety || 0);
            const weighted = 0.3 * tp + 0.3 * co + 0.1 * eq + 0.3 * sa;
            sFormulaHtml = `
                <div style="margin-top: 6px; font-size: 14px; color: #111827; line-height: 1.6;">
                    S = 100 - (0.3×${tp.toFixed(2)} + 0.3×${co.toFixed(2)} + 0.1×${eq.toFixed(2)} + 0.3×${sa.toFixed(2)}) = 100 - ${weighted.toFixed(2)} = ${S.toFixed(2)}
                </div>
            `;
        }
        
        finalScore.innerHTML = `
            <div>失效可能性 S = ${S.toFixed(2)}</div>
            ${sFormulaHtml}
            <div>失效后果 C = ${C.toFixed(2)}</div>
            <div style="margin-top: 10px; font-weight: bold;">风险值 R = S × C = ${R.toFixed(2)}</div>
            <div class="risk-level" style="margin-top: 10px;">风险等级: ${riskLevel}</div>
            ${explanationHtml}
        `;
        
        console.log('finalScore.innerHTML已设置');
        
        // 显示结果展示部分
        resultsSection.style.display = 'block';
        
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    classifyRisk(R) {
        if (R > 0 && R < 3600) return '低风险';
        if (R >= 3600 && R < 7800) return '中等风险';
        if (R >= 7800 && R < 12600) return '较高风险';
        if (R >= 12600 && R <= 15000) return '高风险';
        return '未评定';
    }
    
    // 检查是否选择了失效可能性S=100的特殊选项
    checkSpecialOptionsForFailureProbability() {
        const specialOptions = [];
        
        console.log('检查特殊选项，当前scores对象:', this.scores);
        console.log('检查safety模块scores:', this.scores.safety);
        
        // 检查焊接质量选项
        if (this.scores.safety && this.scores.safety.wqual1 === 'wqual1a') {
            specialOptions.push('D.5.2.4.7焊接及其检验的评分焊接质量中的焊缝含有不能通过GB/T 19624进行的安全评定的缺陷，取失效可能性S直接为100');
            console.log('检测到焊接质量特殊选项');
        } else {
            console.log('焊接质量选项检查: wqual1 =', this.scores.safety?.wqual1, '期望值: wqual1a');
        }
        
        // 检查附加安全裕度选项（通过DOM检查，不依赖scores对象）
        // 移除对this.scores的依赖，完全依赖DOM检查
        
        // 检查管体缺陷检验及评价结果选项
        if (this.scores.safety && this.scores.safety.dr1 === 'dr1b') {
            specialOptions.push('D.5.3.4.4管体缺陷检验及评价的评分管体缺陷检验及评价结果中的管体含有不能通过按照GB/T 19624安全评定的缺陷，则取失效可能性S直接为100');
            console.log('检测到管体缺陷检验特殊选项');
        } else {
            console.log('管体缺陷检验选项检查: dr1 =', this.scores.safety?.dr1, '期望值: dr1b');
        }
        
        // 额外检查：通过DOM元素直接检查选项状态
        this.checkSpecialOptionsFromDOM(specialOptions);
        
        console.log('找到的特殊选项数量:', specialOptions.length);
        console.log('特殊选项内容:', specialOptions);
        
        return specialOptions;
    }
    
    // 通过DOM元素直接检查特殊选项状态
    checkSpecialOptionsFromDOM(specialOptions) {
        // 检查焊接质量选项
        const weldingQualitySelect = document.querySelector('#module-safety select[data-item-id="wqual1"]');
        if (weldingQualitySelect && weldingQualitySelect.value === 'wqual1a') {
            const optionText = weldingQualitySelect.options[weldingQualitySelect.selectedIndex].text;
            if (!specialOptions.some(option => option.includes('焊接质量'))) {
                specialOptions.push(`D.5.2.4.7焊接及其检验的评分焊接质量中的焊缝含有不能通过GB/T 19624进行的安全评定的缺陷，取失效可能性S直接为100`);
                console.log('通过DOM检测到焊接质量特殊选项');
            }
        }
        
        // 检查管体缺陷检验及评价结果选项
        const defectResultSelect = document.querySelector('#module-safety select[data-item-id="dr1"]');
        if (defectResultSelect && defectResultSelect.value === 'dr1b') {
            const optionText = defectResultSelect.options[defectResultSelect.selectedIndex].text;
            if (!specialOptions.some(option => option.includes('管体缺陷检验'))) {
                specialOptions.push(`D.5.3.4.4管体缺陷检验及评价的评分管体缺陷检验及评价结果中的管体含有不能通过按照GB/T 19624安全评定的缺陷，则取失效可能性S直接为100`);
                console.log('通过DOM检测到管体缺陷检验特殊选项');
            }
        }
        
        // 检查附加安全裕度输入框（支持文本S=100与负值两种形态）
        const safetyMarginInput = document.querySelector('#module-safety input[data-item-id="safetyMargin1"]');
        if (safetyMarginInput) {
            const rawVal = safetyMarginInput.value?.toString() || '';
            const value = parseFloat(rawVal);
            const isS100Flag = safetyMarginInput.dataset && safetyMarginInput.dataset.s100 === 'true';
            const isS100Text = /S\s*=\s*100/i.test(rawVal) || /s\s*=\s*100/i.test(rawVal);
            if (isS100Flag || isS100Text || (!isNaN(value) && value < 0)) {
                if (!specialOptions.some(option => option.includes('附加安全裕度'))) {
                    specialOptions.push(`D.5.2.5附加安全裕度小于0，失效可能性S=100`);
                    console.log('通过DOM检测到附加安全裕度S=100状态, raw:', rawVal, ' parsed:', value, ' flag:', isS100Flag);
                }
            }
        }
    }
    


    // 检查未完成的模块
    checkIncompleteModules() {
        const incompleteModules = [];
        const moduleNames = {
            'third_party': '第三方破坏',
            'corrosion': '腐蚀',
            'equipment': '设备及操作',
            'safety': '管道本质安全',
            'consequence': '失效后果'
        };

        // 检查每个模块是否都存在
        const missingModules = [];
        Object.keys(moduleNames).forEach(moduleId => {
            const module = document.getElementById(`module-${moduleId}`);
            if (!module) {
                missingModules.push({
                    id: moduleId,
                    name: moduleNames[moduleId],
                    reason: '模块不存在'
                });
            }
        });

        if (missingModules.length > 0) {
            incompleteModules.push(...missingModules);
            return incompleteModules;
        }

        // 检查每个模块的评分完成情况
        Object.keys(moduleNames).forEach(moduleId => {
            const module = document.getElementById(`module-${moduleId}`);
            if (!module) return;



            // 首先检查模块内容是否已经渲染
            const scoringSystem = module.querySelector('.scoring-system');
            if (!scoringSystem) {
                // 如果模块内容还没有渲染，先渲染它
                this.renderModuleContent(moduleId);
            }

            // 不再检查模块是否被锁定，因为不再锁定其他模块
            // if (this.isModuleLocked(moduleId)) {
            //     // 如果模块被锁定，跳过检查，认为该模块已完成
            //     return; // 跳过当前模块的检查
            // }

            // 再次查找该模块中所有未禁用的选项
            const allSelects = module.querySelectorAll('.option-select:not([disabled])');
            const unselectedSelects = Array.from(allSelects).filter(select => !select.value || select.value === '');
            
            if (allSelects.length === 0) {
                // 如果模块中没有选项，标记为不完整
                incompleteModules.push({
                    id: moduleId,
                    name: moduleNames[moduleId],
                    unselectedCount: 0,
                    reason: '模块中没有评分选项'
                });
            } else if (unselectedSelects.length > 0) {
                // 如果有未选择的选项，标记为不完整
                incompleteModules.push({
                    id: moduleId,
                    name: moduleNames[moduleId],
                    unselectedCount: unselectedSelects.length,
                    totalCount: allSelects.length,
                    reason: '有未完成的评分项'
                });
            }
        });

        return incompleteModules;
    }

    // 显示未完成警告提示框
    showIncompleteWarning(incompleteModules) {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'incomplete-warning-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>此页面显示</h3>
                </div>
                <div class="modal-body">
                    <p>您有未完成的打分项，请检查所有标签页并全部完成后再计算！</p>
                    <div class="incomplete-list">
                        <p><strong>未完成的模块：</strong></p>
                        <ul>
                            ${incompleteModules.map(module => 
                                `<li>${module.name} (${module.unselectedCount}项未完成)</li>`
                            ).join('')}
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="goToIncomplete">跳转到未完成项</button>
                    <button class="btn btn-secondary" id="closeModal">确定</button>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(modal);

        // 绑定事件
        const goToBtn = modal.querySelector('#goToIncomplete');
        const closeBtn = modal.querySelector('#closeModal');

        goToBtn.addEventListener('click', () => {
            this.goToFirstIncompleteModule(incompleteModules);
            this.closeModal(modal);
        });

        closeBtn.addEventListener('click', () => {
            this.closeModal(modal);
        });

        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
    }

    // 显示未完成警告提示框
    showIncompleteWarning(incompleteModules) {
        // 创建模态框
        const modal = document.createElement('div');
        modal.className = 'incomplete-warning-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-body">
                    <p>您有未完成的打分项，请检查所有标签页并全部完成后再计算！</p>
                    <div class="incomplete-details">
                        <p><strong>需要完成的模块：</strong></p>
                        <ul>
                            ${incompleteModules.map(module => {
                                if (module.reason === '模块不存在') {
                                    return `<li>${module.name} - ${module.reason}</li>`;
                                } else if (module.reason === '模块中没有评分选项') {
                                    return `<li>${module.name} - ${module.reason}</li>`;
                                } else {
                                    return `<li>${module.name} - ${module.unselectedCount}项未完成</li>`;
                                }
                            }).join('')}
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="closeModal">确定</button>
                </div>
            </div>
        `;

        // 添加到页面
        document.body.appendChild(modal);

        // 绑定事件
        const closeBtn = modal.querySelector('#closeModal');

        closeBtn.addEventListener('click', () => {
            this.closeModal(modal);
        });

        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
    }

    // 关闭模态框
    closeModal(modal) {
        if (modal && modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    }

    calculateModuleTotalScore(moduleId) {
        const module = document.getElementById(`module-${moduleId}`);
        if (!module) return 0;

        // S=100 显示满分
        if (this.isInS100State() && this.shouldShowFullScore(moduleId)) {
            const maxScore = this.getModuleMaxScore(moduleId);
            console.log(`模块 ${moduleId} 处于S=100状态，应显示满分: ${maxScore}`);
            return maxScore;
        }

        // 逐小节累加，带选项卡的小节仅统计激活选项卡
        let totalScore = 0;
        const sections = module.querySelectorAll('.scoring-section');
        sections.forEach(section => {
            const sectionScore = this.calculateSectionScore(section);
            if (!isNaN(sectionScore)) totalScore += sectionScore;
        });

        // 针对管道本质安全模块：明确等于四大分项（D.5.2/5.3/5.4/5.5）之和
        if (moduleId === 'safety') {
            // 如果页面有分项得分显示元素，可在此精确求和；当前按section求和已满足设计，保持返回值
        }
        return totalScore;
    }

    toggleSection(sectionTitle) {
        const sectionContent = sectionTitle.nextElementSibling;
        const icon = sectionTitle.querySelector('i');
        
        if (sectionContent.classList.contains('expanded')) {
            sectionContent.classList.remove('expanded');
            sectionContent.classList.add('collapsed');
            sectionTitle.classList.remove('collapsed');
            icon.className = 'fas fa-chevron-right';
        } else {
            sectionContent.classList.remove('collapsed');
            sectionContent.classList.add('expanded');
            sectionTitle.classList.add('collapsed');
            icon.className = 'fas fa-chevron-down';
        }
    }

    handleScoreChange(selectElement) {
        const moduleId = selectElement.getAttribute('data-module-id');
        const itemId = selectElement.getAttribute('data-item-id');
        const selectedOption = selectElement.selectedOptions[0];
        
        console.log(`处理分数变化: moduleId=${moduleId}, itemId=${itemId}`);
        
        if (!moduleId || !itemId) {
            console.error('缺少必要的属性: moduleId或itemId为空');
            return;
        }
        
        if (selectedOption && selectedOption.dataset.score) {
            const score = parseFloat(selectedOption.dataset.score);
            
            // 保存选择状态
            if (!this.scores[moduleId]) {
                this.scores[moduleId] = {};
            }
            this.scores[moduleId][itemId] = selectedOption.value;
            
            // 添加调试信息，特别关注特殊选项
            if (moduleId === 'safety' && (itemId === 'wqual1' || itemId === 'drId' || itemId === 'safetyMargin1')) {
                console.log(`保存safety模块选项: ${itemId} = ${selectedOption.value}, score = ${score}`);
            }
            
            this.updateModuleScore(moduleId, score);
            
            // 处理埋深评分的互斥逻辑 - 已移除，现在使用条件选择方式
            
            // 取消大气腐蚀评分的互斥逻辑 - 已移除，现在使用条件选择方式
            
            // 延迟更新得分，避免重复计算
            setTimeout(() => {
                console.log(`更新模块 ${moduleId} 的分数显示`);
                this.updateSectionScores(moduleId);
            }, 0);
        } else {
            // 当选择被复原为占位项或无得分选项时，解除禁用状态 - 已移除，现在使用条件选择方式
            // 移除埋深评分的重置逻辑 - 现在使用条件选择方式

            setTimeout(() => {
                this.updateSectionScores(moduleId);
            }, 0);
        }
    }
    
    // 处理输入框变化
    handleInputChange(inputElement) {
        const moduleId = inputElement.getAttribute('data-module-id');
        const itemId = inputElement.getAttribute('data-item-id');
        
        if (!moduleId || !itemId) {
            console.error('缺少必要的属性: moduleId或itemId为空');
            return;
        }
        
        // 更新导航栏分数显示
        const moduleTotal = this.calculateModuleTotalScore(moduleId);
        this.updateNavigationScore(moduleId, moduleTotal);
        
        // 延迟更新得分，避免重复计算
        setTimeout(() => {
            this.updateSectionScores(moduleId);
        }, 0);
    }

    // 处理埋深评分的互斥逻辑 - 已移除，现在使用条件选择方式

    // 重置水下穿越管道埋深评分为"不评分" - 已移除，现在使用条件选择方式

    // 重置非水下穿越管道埋深评分为"不评分" - 已移除，现在使用条件选择方式

    // 禁用水下穿越管道埋深评分选项 - 已移除，现在使用条件选择方式

    // 禁用非水下穿越管道埋深评分选项 - 已移除，现在使用条件选择方式

    // 启用所有埋深评分选项 - 已移除，现在使用条件选择方式

    // 已取消大气腐蚀评分互斥逻辑：不再对 D.3.2.2 与 D.3.2.3 进行互斥处理
    handleAtmosphericCorrosionMutualExclusion(itemId, score) {
        return;
    }

    // 重置跨越段大气腐蚀评分 - 已移除，现在使用条件选择方式

    // 重置埋地段大气腐蚀评分 - 已移除，现在使用条件选择方式

    // 禁用大气腐蚀评分选项 - 已移除，现在使用条件选择方式

    // 启用所有大气腐蚀评分选项 - 已移除，现在使用条件选择方式

    updateModuleScore(moduleId, score) {
        // 始终使用DOM当前状态重新计算模块总分，
        // 确保“第三方破坏”分数为所有子项之和（含D.2.3.3只取激活选项卡的得分）。
        const moduleTotal = this.calculateModuleTotalScore(moduleId);
        this.updateNavigationScore(moduleId, moduleTotal);
    }
    
    // 更新导航栏分数显示
    updateNavigationScore(moduleId, score) {
        const navScore = document.querySelector(`.nav-score[data-module="${moduleId}"]`);
        if (navScore) {
            navScore.textContent = `得分：${score || '—'}`;
        }
    }
    
    // 确保所有模块都被渲染
    ensureAllModulesRendered() {
        const modules = ['third_party', 'corrosion', 'equipment', 'safety', 'consequence'];
        modules.forEach(moduleId => {
            this.ensureModuleRendered(moduleId);
        });
        
        // 初始化选项卡状态
        this.initializeTabs();
        // 默认激活腐蚀模块的大气腐蚀选项卡为“跨越段”
        try {
            const corrosionTabs = document.querySelector('#module-corrosion .tabs-container');
            if (corrosionTabs) {
                const section = this.findSectionByModuleId('corrosion');
                if (section && section.tabs && section.tabs.length > 1) {
                    // 索引1为跨越段
                    this.switchTab(corrosionTabs, 1, section, 'corrosion');
                    // 设置跨越段面板默认最高值，并在首次加载时同时将埋地段设置为最高值
                    this.setCorrosionActiveTabDefaults();
                    this.setCorrosionInitialDefaults();
                }
            }
        } catch (e) { console.warn('初始化腐蚀模块默认选项卡失败', e); }

        // 监听腐蚀模块选项卡点击，切换后应用默认最高值
        document.addEventListener('click', (e) => {
            const header = e.target.closest && e.target.closest('#module-corrosion .tabs-header');
            if (header) {
                // 等待DOM完成激活切换
                setTimeout(() => this.setCorrosionActiveTabDefaults(), 0);
            }
        });

        // 观察腐蚀模块选项卡激活变更，确保任何方式切换都恢复为默认最高值
        this.observeCorrosionTabsActivation();
    }
    
    // 初始化选项卡状态
    initializeTabs() {
        // 查找所有选项卡容器
        const tabsContainers = document.querySelectorAll('.tabs-container');
        
        tabsContainers.forEach(container => {
            const moduleId = container.dataset.moduleId;
            if (!moduleId) return;

            const section = this.findSectionByModuleId(moduleId);
            if (section && section.tabs && section.tabs.length > 1) {
                if (moduleId === 'third_party') {
                    // 第三方破坏：默认激活索引1（例如水下穿越）
                    this.switchTab(container, 1, section, moduleId);
                } else if (moduleId === 'consequence') {
                    // 失效后果 E.2：默认激活索引0（天然气）
                    this.switchTab(container, 0, section, moduleId);
                } else {
                    // 其他模块按数据中的 active 或默认分数初始化
                    this.initializeDefaultTabScore(moduleId);
                }
            } else {
                // 保底：初始化默认选项卡分数
                this.initializeDefaultTabScore(moduleId);
            }
        });

        // 选项卡初始化完成后，刷新一次所有模块的分数显示
        this.updateAllModuleScores();
    }

    // 根据模块ID查找对应的section（为第三方埋深和腐蚀模块提供选项卡定义）
    findSectionByModuleId(moduleId) {
        // 根据模块ID查找对应的section数据
        if (moduleId === 'third_party') {
            // 直接返回D.2.3.3埋深的评分section数据
            return {
                id: "D2233",
                title: "D.2.3.3埋深的评分",
                maxScore: 8,
                type: "conditional",
                items: [
                    {
                        id: "depth_type_selector",
                        title: "请选择管道类型",
                        options: [
                            { id: "", text: "请选择" },
                            { id: "non_underwater", text: "非水下穿越管道埋深的评分", score: null },
                            { id: "underwater", text: "水下穿越管道埋深的评分", score: null }
                        ],
                        selected: "",
                        conditional: true
                    }
                ],
                conditionalContent: {
                    non_underwater: {
                        id: "D22332",
                        title: "D.2.3.3.2非水下穿越管道埋深的评分",
                        items: [
                            {
                                id: "depth1a",
                                title: "跨越段或露管段",
                                options: [
                                    { id: "depth1a1", text: "跨越段或露管段", score: 0 }
                                ],
                                selected: "depth1a1"
                            },
                            {
                                id: "depth1b",
                                title: "埋地段",
                                inputType: "number",
                                minValue: 0,
                                maxValue: 8,
                                step: 0.1,
                                placeholder: "请输入0-8之间的数值，根据实际埋深评分",
                                defaultValue: 0,
                                showCalculator: true
                            }
                        ]
                    },
                    underwater: {
                        id: "D22333",
                        title: "D.2.3.3.3水下穿越管道埋深的评分",
                        subitems: [
                            {
                                id: "depth2",
                                title: "可通航河道河底土壤表面(河床表面)与航船底面距离或未通航河道的水深",
                                maxScore: 2,
                                items: [
                                    {
                                        id: "depth2a",
                                        title: "通航距离或深度",
                                        options: [
                                            { id: "depth2a1", text: "上述距离或深度∈[0m～0.5m)", score: 0 },
                                            { id: "depth2a2", text: "上述距离或深度∈[0.5m～1.0m)", score: 0.5 },
                                            { id: "depth2a3", text: "上述距离或深度∈[1.0m～1.5m)", score: 1 },
                                            { id: "depth2a4", text: "上述距离或深度∈[1.5m～2.0m)", score: 1.5 },
                                            { id: "depth2a5", text: "上述距离或深度≥2.0m", score: 2 }
                                        ],
                                        selected: "depth2a5"
                                    }
                                ]
                            },
                            {
                                id: "depth3",
                                title: "在河底的土壤埋深",
                                maxScore: 4,
                                items: [
                                    {
                                        id: "depth3a",
                                        title: "土壤埋深",
                                        options: [
                                            { id: "depth3a1", text: "埋深∈[0m～0.5m)", score: 0 },
                                            { id: "depth3a2", text: "埋深∈[0.5m～1.0m)", score: 1 },
                                            { id: "depth3a3", text: "埋深∈[1.0m～1.5m)", score: 2 },
                                            { id: "depth3a4", text: "埋深∈[1.5m～2.0m)", score: 3 },
                                            { id: "depth3a5", text: "埋深≥2.0m", score: 4 }
                                        ],
                                        selected: "depth3a5"
                                    }
                                ]
                            },
                            {
                                id: "depth4",
                                title: "保护措施",
                                maxScore: 2,
                                items: [
                                    {
                                        id: "depth4a",
                                        title: "保护措施",
                                        options: [
                                            { id: "depth4a1", text: "无保护措施", score: 0 },
                                            { id: "depth4a2", text: "采用石笼稳管、加设固定墩等稳管措施", score: 1 },
                                            { id: "depth4a3", text: "采用30mm以上水泥保护层或其他能达到同样加固效果的措施", score: 2 }
                                        ],
                                        selected: "depth4a3"
                                    }
                                ]
                            }
                        ]
                    }
                }
            };
        }
        if (moduleId === 'corrosion') {
            // 返回大气腐蚀条件选择的section定义
            return {
                id: "D32",
                title: "D.3.2大气腐蚀的评分",
                maxScore: 10,
                type: "conditional",
                items: [
                    {
                        id: "atmospheric_type_selector",
                        title: "请选择管道段类型",
                        options: [
                            { id: "", text: "请选择" },
                            { id: "underground", text: "埋地段的大气腐蚀评分" },
                            { id: "crossing", text: "跨越段的大气腐蚀评分" }
                        ],
                        selected: "",
                        conditional: true
                    }
                ],
                conditionalContent: {
                    underground: {
                        id: "D322",
                        title: "D.3.2.2埋地段的大气腐蚀的评分",
                        items: [
                            {
                                id: "atm1",
                                title: "埋地段的大气腐蚀评分",
                                options: [
                                    { id: "atm1a", text: "埋地段的大气腐蚀的得分为10分", score: 10 },
                                    { id: "atm1b", text: "不参与评分", score: 0 }
                                ],
                                selected: "atm1a"
                            }
                        ]
                    },
                    crossing: {
                        id: "D323",
                        title: "D.3.2.3跨越段的大气腐蚀的评分"
                    }
                }
            };
        }
        return null;
    }

    // 初始化默认选项卡分数
    initializeDefaultTabScore(moduleId) {
        // 查找对应的section数据
        const section = this.findSectionByModuleId(moduleId);
        if (section && section.tabs) {
            // 找到默认激活的选项卡
            const activeTabIndex = section.tabs.findIndex(tab => tab.active);
            if (activeTabIndex !== -1) {
                // 计算默认选项卡的分数
                this.calculateDefaultTabScore(section, moduleId, activeTabIndex);
            }
        }
    }

    // 计算默认选项卡分数
    calculateDefaultTabScore(section, moduleId, activeIndex) {
        const activeTab = section.tabs[activeIndex];
        
        // 清空当前模块的所有分数记录
        if (this.scores[moduleId]) {
            this.scores[moduleId] = {};
        }
        
        let totalScore = 0;
        
        if (activeTab.content.subitems) {
            activeTab.content.subitems.forEach(subitem => {
                if (subitem.items) {
                    subitem.items.forEach(item => {
                        if (item.options && item.selected) {
                            const selectedOption = item.options.find(opt => opt.id === item.selected);
                            if (selectedOption && selectedOption.score !== null) {
                                this.scores[moduleId][item.id] = selectedOption.score;
                                totalScore += selectedOption.score;
                            }
                        }
                    });
                }
            });
        }
        
        if (activeTab.content.items) {
            activeTab.content.items.forEach(item => {
                if (item.options && item.selected) {
                    const selectedOption = item.options.find(opt => opt.id === item.selected);
                    if (selectedOption && selectedOption.score !== null) {
                        this.scores[moduleId][item.id] = selectedOption.score;
                        totalScore += selectedOption.score;
                    }
                } else if (item.inputType === "number") {
                    const inputElement = document.querySelector(`[data-item-id="${item.id}"] input`);
                    if (inputElement) {
                        let value;
                        value = parseFloat(inputElement.value) || 0;
                        this.scores[moduleId][item.id] = value;
                        totalScore += value;
                    }
                }
            });
        }
        
        // 更新导航栏分数显示
        this.updateNavigationScore(moduleId, totalScore);
    }
    
    // 更新所有模块的分数显示
    updateAllModuleScores() {
        const modules = ['third_party', 'corrosion', 'equipment', 'safety', 'consequence'];
        modules.forEach(moduleId => {
            this.updateSectionScores(moduleId);
            // 同时更新导航栏分数显示
            const score = this.calculateModuleTotalScore(moduleId);
            this.updateNavigationScore(moduleId, score);
        });
    }

    // 大气腐蚀不再互斥：仅更新分数显示，不清空也不禁用
    handleAtmosphericCorrosionChange(select, type) {
        const moduleId = select.getAttribute('data-module-id');
        this.updateSectionScores(moduleId);
    }

    // 设置当前激活的大气腐蚀选项卡默认最高值；另一个选项卡恢复为页面初始默认（最高值）
    setCorrosionActiveTabDefaults() {
        const module = document.getElementById('module-corrosion');
        if (!module) return;

        const activeContent = module.querySelector('.tabs-content .tab-content.active');
        const allContents = module.querySelectorAll('.tabs-content .tab-content');
        if (!activeContent || allContents.length === 0) return;

        // 辅助：将某个面板的所有选择器设置为最高分
        const setHighest = (root) => {
            const selects = root.querySelectorAll('select.option-select');
            selects.forEach(select => {
                let best = null;
                let bestScore = -Infinity;
                Array.from(select.options).forEach(opt => {
                    const s = parseFloat(opt.dataset.score);
                    if (!isNaN(s) && s >= bestScore) {
                        bestScore = s; best = opt.value;
                    }
                });
                if (best != null) select.value = best;
            });
        };

        // 对所有面板应用：激活面板最高，其他面板恢复到初始默认（最高值）
        allContents.forEach(content => {
            setHighest(content);
        });

        // 刷新分数
        this.updateSectionScores('corrosion');
    }

    // 首次加载时：同时将 D.3.2.2（埋地段）设置为最高值
    setCorrosionInitialDefaults() {
        const module = document.getElementById('module-corrosion');
        if (!module) return;
        const undergroundTab = module.querySelector('.tabs-content .tab-content:nth-child(1)');
        if (!undergroundTab) return;
        const selects = undergroundTab.querySelectorAll('select.option-select');
        selects.forEach(select => {
            let best = null;
            let bestScore = -Infinity;
            Array.from(select.options).forEach(opt => {
                const s = parseFloat(opt.dataset.score);
                if (!isNaN(s) && s >= bestScore) { bestScore = s; best = opt.value; }
            });
            if (best != null) select.value = best;
        });
        this.updateSectionScores('corrosion');
    }

    // 通过MutationObserver监听腐蚀模块选项卡active变化，统一应用默认
    observeCorrosionTabsActivation() {
        const module = document.getElementById('module-corrosion');
        if (!module) return;
        const tabsContent = module.querySelector('.tabs-content');
        if (!tabsContent) return;
        const observer = new MutationObserver(() => {
            // 延迟到DOM稳定后应用
            setTimeout(() => this.setCorrosionActiveTabDefaults(), 0);
        });
        observer.observe(tabsContent, { attributes: true, subtree: true, attributeFilter: ['class'] });
        // 保存到实例，防止GC（如需移除可拓展）
        this._corrosionTabsObserver = observer;
    }
    
    // 更新大气腐蚀的分数显示（页面加载时使用）
    updateAtmosphericCorrosionScores() {
        // 只刷新显示，不做任何互斥相关的清空/禁用
        this.updateSectionScores('corrosion');
    }
    
    // 保底：初始化埋深评分输入框（避免缺失方法导致报错）
    initializeDepthInputs() {
        try {
            const module = document.getElementById('module-third_party');
            if (!module) return;
            
            // 找到埋地段输入框
            const depthInput = module.querySelector('input[data-item-id="depth1b"]');
            if (depthInput) {
                // 确保输入框类型和属性正确
                depthInput.type = 'number';
                depthInput.step = 'any';
                depthInput.min = '0';
                depthInput.max = '8';
                
                // 如果输入框为空或为默认值0，确保显示正确的placeholder
                if (!depthInput.value || depthInput.value === "0") {
                    depthInput.value = '';
                    depthInput.placeholder = '请输入0-8之间的数值，根据实际埋深评分';
                }
                
                console.log('埋深输入框初始化完成:', depthInput.value, depthInput.placeholder);
            }
            
            // 处理其他depth相关输入框
            const otherInputs = module.querySelectorAll('input[id*="depth"]:not([data-item-id="depth1b"])');
            otherInputs.forEach(input => {
                if (!input.type) input.type = 'number';
                if (!input.step) input.step = 'any';
                input.min = input.min || '0';
            });
        } catch (e) {
            // 忽略初始化异常，避免阻塞后续流程
            console.warn('initializeDepthInputs 执行时出现非致命错误：', e);
        }
    }
    
    // 处理埋深评分的互斥逻辑 - 已移除，现在使用条件选择方式
    
    // 清空并禁用埋深选项 - 已移除，现在使用条件选择方式
    
    // 清空并禁用埋深输入框 - 已移除，现在使用条件选择方式
    

    

    

    

    

    
    // 显示默认选项提示框
    showDefaultOptionsNotice() {
        console.log('正在尝试显示默认选项提示框...');
        
        // 检查提示框是否存在
        const notice = document.getElementById('default-options-notice');
        
        if (notice) {
            console.log('找到提示框元素，正在显示...');
            notice.style.display = 'flex';
            notice.style.visibility = 'visible';
            notice.style.opacity = '1';
        } else {
            console.error('未找到提示框元素');
        }
    }
    
    // 创建默认选项提示框
    createDefaultNotice() {
        const notice = document.createElement('div');
        notice.id = 'default-options-notice';
        notice.className = 'default-notice-overlay';
        
        notice.innerHTML = `
            <div class="default-notice-modal">
                <div class="default-notice-header">
                    <i class="fas fa-info-circle"></i>
                    <h3>重要提示</h3>
                </div>
                <div class="default-notice-content">
                    <p class="notice-main-text">当前网页所有默认选项均为「最低值选项」，请您根据实际需求核对调整，避免影响使用效果。</p>
                    <p class="notice-sub-text">补充说明：若存在多个选项默认均显示为最低值的情况，系统将自动取其中一个最低值生效，建议您手动确认最终生效选项是否符合预期。</p>
                </div>
                <div class="default-notice-footer">
                    <button type="button" class="notice-close-btn" onclick="closeDefaultNotice()">我知道了</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notice);
        console.log('提示框已创建并添加到页面');
        return notice;
    }
    
    // 重新启用大气腐蚀选项（当用户想要切换选择时）
    reEnableAtmosphericCorrosionOptions(moduleId) {
        const module = document.getElementById(`module-${moduleId}`);
        if (!module) return;
        
        // 重新启用埋地段选项
        const undergroundSelect = module.querySelector('select[data-item-id="atm1"]');
        if (undergroundSelect) {
            undergroundSelect.disabled = false;
            undergroundSelect.style.opacity = '1';
            undergroundSelect.style.cursor = 'pointer';
        }
        
        // 重新启用跨越段选项
        const crossingOptionIds = ['pos1', 'struct1', 'corrosion1', 'app1', 'quality1', 'inspection1', 'repair1'];
        crossingOptionIds.forEach(optionId => {
            const select = module.querySelector(`select[data-item-id="${optionId}"]`);
            if (select) {
                select.disabled = false;
                select.style.opacity = '1';
                select.style.cursor = 'pointer';
            }
        });
    }
    
    // 清空跨越段的所有选项并禁用
    clearCrossingSectionOptions(moduleId) {
        const module = document.getElementById(`module-${moduleId}`);
        if (!module) return;
        
        // 跨越段的所有选项ID
        const crossingOptionIds = ['pos1', 'struct1', 'corrosion1', 'app1', 'quality1', 'inspection1', 'repair1'];
        
        crossingOptionIds.forEach(optionId => {
            const select = module.querySelector(`select[data-item-id="${optionId}"]`);
            if (select) {
                select.value = '';
                select.disabled = true;
                select.style.opacity = '0.5';
                select.style.cursor = 'not-allowed';
                
                // 清空对应的分数
                if (this.scores[moduleId] && this.scores[moduleId][optionId]) {
                    delete this.scores[moduleId][optionId];
                }
            }
        });
    }
    
    // 清空埋地段大气腐蚀评分选项并禁用
    clearUndergroundSectionOption(moduleId) {
        const module = document.getElementById(`module-${moduleId}`);
        if (!module) return;
        
        const select = module.querySelector('select[data-item-id="atm1"]');
        if (select) {
            select.value = '';
            select.disabled = true;
            select.style.opacity = '0.5';
            select.style.cursor = 'not-allowed';
            
            // 清空对应的分数
            if (this.scores[moduleId] && this.scores[moduleId]['atm1']) {
                delete this.scores[moduleId]['atm1'];
            }
        }
    }
    
    // 显示附加安全裕度警告提示框
    showSafetyMarginWarning() {
        // 不锁定其他选项，让用户继续选择
        // this.lockAllOtherOptions('safety', 'safetyMargin1');
        
        // 更新分数显示
        this.updateSectionScores('safety');
        
        // 不显示任何提示框
        // this.showNotification('附加安全裕度小于0，失效可能性为100，除失效后果模块外其他模块的选项已锁定', 'warning');
    }

    // 显示特殊选项确认提示框
    showSpecialOptionConfirmation(select, selectedOption) {
        const confirmMessage = "您确定选择这个选项吗？如果选择，失效可能性为100，并不可再进行选择";
        
        // 使用自定义确认对话框替换原生confirm
        if (typeof showConfirmDialog === 'function') {
            showConfirmDialog(confirmMessage, (confirmed) => {
                if (confirmed) {
                    // 不禁用选择器，让用户可以继续选择
                    // select.disabled = true;
                    // select.style.opacity = '0.5';
                    // select.style.cursor = 'not-allowed';
                    
                    // 保存选择状态
                    const moduleId = select.getAttribute('data-module-id');
                    const itemId = select.getAttribute('data-item-id');
                    
                    if (!this.scores[moduleId]) {
                        this.scores[moduleId] = {};
                    }
                    this.scores[moduleId][itemId] = selectedOption.value;
                    
                    // 不锁定其他选项，让用户继续选择
                    // this.lockAllOtherOptions(moduleId, itemId);
                    
                    // 更新分数显示
                    this.updateSectionScores(moduleId);
                    
                    // 显示成功提示
                    this.showNotification('选项已选择，失效可能性为100', 'info');
                } else {
                    // 用户取消选择：重置为"请选择评分"，并清除已保存的该项分数
                    const moduleId = select.getAttribute('data-module-id');
                    const itemId = select.getAttribute('data-item-id');
                    select.value = '';
                    if (this.scores[moduleId] && this.scores[moduleId][itemId] !== undefined) {
                        delete this.scores[moduleId][itemId];
                    }
                    // 触发一次change以确保UI与内部状态一致
                    setTimeout(() => {
                        select.dispatchEvent(new Event('change'));
                    }, 0);
                    // 立即刷新分数显示
                    this.updateSectionScores(moduleId);
                }
            });
        } else {
            // 备用方案：如果自定义对话框不可用，使用原生confirm
            if (confirm(confirmMessage)) {
                // 不禁用选择器，让用户可以继续选择
                // select.disabled = true;
                // select.style.opacity = '0.5';
                // select.style.cursor = 'not-allowed';
                
                // 保存选择状态
                const moduleId = select.getAttribute('data-module-id');
                const itemId = select.getAttribute('data-item-id');
                
                if (!this.scores[moduleId]) {
                    this.scores[moduleId] = {};
                }
                this.scores[moduleId][itemId] = selectedOption.value;
                
                // 不锁定其他选项，让用户继续选择
                // this.lockAllOtherOptions(moduleId, itemId);
                
                // 更新分数显示
                this.updateSectionScores(moduleId);
                
                // 显示成功提示
                this.showNotification('选项已选择，失效可能性为100', 'info');
            } else {
                // 用户取消选择：重置为"请选择评分"，并清除已保存的该项分数
                const moduleId = select.getAttribute('data-module-id');
                const itemId = select.getAttribute('data-item-id');
                select.value = '';
                if (this.scores[moduleId] && this.scores[moduleId][itemId] !== undefined) {
                    delete this.scores[moduleId][itemId];
                }
                // 触发一次change以确保UI与内部状态一致
                setTimeout(() => {
                    select.dispatchEvent(new Event('change'));
                }, 0);
                // 立即刷新分数显示
                this.updateSectionScores(moduleId);
            }
        }
    }
    
    // 直接执行特殊选项确认操作，不显示确认对话框，也不锁定其他选项
    executeSpecialOptionConfirmation(select, selectedOption) {
        // 保存选择状态
        const moduleId = select.getAttribute('data-module-id');
        const itemId = select.getAttribute('data-item-id');
        
        if (!this.scores[moduleId]) {
            this.scores[moduleId] = {};
        }
        this.scores[moduleId][itemId] = selectedOption.value;
        
        // 不锁定其他选项，让用户继续选择
        // this.lockAllOtherOptions(moduleId, itemId);
        
        // 更新分数显示
        this.updateSectionScores(moduleId);
        
        // 不显示任何提示框
        // this.showNotification('选项已锁定，失效可能性为100，除失效后果模块外其他模块的选项已锁定', 'warning');
    }
    
    // 锁定所有模块的所有选项（失效后果模块除外）
    lockAllOtherOptions(excludeModuleId, excludeItemId) {
        const allModules = ['third_party', 'corrosion', 'equipment', 'safety']; // 移除consequence模块
        
        allModules.forEach(moduleId => {
            const module = document.getElementById(`module-${moduleId}`);
            if (!module) return;
            
            // 确保模块内容被渲染
            this.ensureModuleRendered(moduleId);
            
            // 找到模块中所有的选择器
            const allSelects = module.querySelectorAll('.option-select');
            console.log(`模块 ${moduleId} 中找到 ${allSelects.length} 个选择器`);
            
            allSelects.forEach(select => {
                const currentItemId = select.getAttribute('data-item-id');
                
                // 跳过当前选中的特殊选项
                if (moduleId === excludeModuleId && currentItemId === excludeItemId) {
                    return;
                }
                
                // 不锁定选择器，让用户继续选择
                // select.disabled = true;
                // select.style.opacity = '0.5';
                // select.style.cursor = 'not-allowed';
                
                // 不清空选择值，让用户保持选择
                // select.value = '';
                
                // 不清空对应的分数，让用户保持选择
                // if (this.scores[moduleId] && this.scores[moduleId][currentItemId]) {
                //     delete this.scores[moduleId][currentItemId];
                // }
            });
            
            // 不清空模块分数，让用户保持选择
            // if (this.scores[moduleId]) {
            //     if (moduleId === excludeModuleId && excludeItemId) {
            //         // 保留触发锁定的特殊选项分数
            //         const specialScore = this.scores[moduleId][excludeItemId];
            //         this.scores[moduleId] = {};
            //         if (specialScore !== undefined) {
            //         this.scores[moduleId][excludeItemId] = specialScore;
            //         }
            //     } else {
            //         // 完全清空模块分数
            //         this.scores[moduleId] = {};
            //     }
            // }
            
            // 不添加锁定提示，因为不再锁定其他选项
            // this.addModuleLockedNotice(moduleId, excludeModuleId);
        });
        
        // 更新所有模块的分数显示
        this.updateAllModuleScores();
        
        // 不需要强制刷新，因为不再锁定其他选项
        // setTimeout(() => {
        //     this.forceUpdateAllScores();
        // }, 100);
    }
    
    // 确保模块内容被渲染
    ensureModuleRendered(moduleId) {
        const module = document.getElementById(`module-${moduleId}`);
        if (!module) return;
        
        const content = module.querySelector('.module-content');
        if (!content) return;
        
        // 强制渲染模块内容，即使已经渲染过
        console.log(`强制渲染模块 ${moduleId}...`);
        this.forceRenderModuleContent(moduleId);
    }
    
    // 强制渲染模块内容
    forceRenderModuleContent(moduleId) {
        const module = document.getElementById(`module-${moduleId}`);
        if (!module) return;

        const content = module.querySelector('.module-content');
        if (!content) return;

        // 清除现有内容
        content.innerHTML = '';

        // 重新渲染模块内容
        switch (moduleId) {
            case 'third_party':
                this.renderThirdPartyModule(content);
                break;
            case 'corrosion':
                this.renderCorrosionModule(content);
                break;
            case 'equipment':
                this.renderEquipmentModule(content);
                break;
            case 'safety':
                this.renderSafetyModule(content);
                break;
            case 'consequence':
                this.renderFailureConsequenceModule(content);
                break;
        }
    }
    
    // 添加模块锁定提示
    addModuleLockedNotice(moduleId, excludeModuleId) {
        const module = document.getElementById(`module-${moduleId}`);
        if (!module) return;
        
        // 检查是否已经有锁定提示
        if (module.querySelector('.module-locked-notice')) {
            return;
        }
        
        const notice = document.createElement('div');
        notice.className = 'module-locked-notice';
        notice.style.cssText = `
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            color: #92400e;
            font-weight: 500;
            text-align: center;
            animation: slideIn 0.3s ease-out;
        `;
        
        // 根据是否是触发锁定的模块显示不同的提示信息
        let message;
        if (moduleId === excludeModuleId) {
            message = "已选择失效可能性为100的选项";
        } else {
            message = "其他模块已选择失效可能性为100的选项";
        }
        
        notice.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                <span style="font-size: 18px;">⚠</span>
                <span>${message}</span>
            </div>
        `;
        
        // 插入到模块内容的最前面
        const moduleContent = module.querySelector('.module-content');
        if (moduleContent) {
            moduleContent.insertBefore(notice, moduleContent.firstChild);
        }
    }
    // 显示通知提示
    showNotification(message, type = 'info') {
        // 创建模态背景（固定居中，避免初次出现位置漂移）
        const modal = document.createElement('div');
        modal.className = 'notification-modal';
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
        `;
        
        // 创建通知对话框
        const dialog = document.createElement('div');
        dialog.className = 'notification-dialog';
        dialog.style.cssText = `
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            max-width: 400px;
            width: 90%;
            padding: 0;
            animation: fadeInScale 0.18s ease-out;
        `;
        
        // 创建对话框内容
        const content = document.createElement('div');
        content.style.cssText = `
            padding: 24px;
            text-align: center;
        `;
        
        // 创建图标
        const icon = document.createElement('div');
        icon.style.cssText = `
            width: 48px;
            height: 48px;
            margin: 0 auto 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
        `;
        
        // 根据类型设置图标和颜色
        switch(type) {
            case 'warning':
                icon.style.backgroundColor = '#f59e0b';
                icon.textContent = '⚠';
                break;
            case 'success':
                icon.style.backgroundColor = '#10b981';
                icon.textContent = '✓';
                break;
            case 'error':
                icon.style.backgroundColor = '#ef4444';
                icon.textContent = '✕';
                break;
            default:
                icon.style.backgroundColor = '#3b82f6';
                icon.textContent = 'ℹ';
        }
        
        // 创建消息文本
        const messageEl = document.createElement('p');
        messageEl.style.cssText = `
            margin: 0 0 24px 0;
            color: #374151;
            font-size: 16px;
            line-height: 1.5;
        `;
        messageEl.textContent = message;
        
        // 创建确定按钮
        const button = document.createElement('button');
        button.textContent = '确定';
        button.style.cssText = `
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        `;
        
        // 按钮悬停效果
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#2563eb';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#3b82f6';
        });
        
        // 点击确定关闭对话框
        button.addEventListener('click', () => {
            modal.style.animation = 'fadeOut 0.3s ease-in';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        });
        
        // 点击背景关闭对话框
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                button.click();
            }
        });
        
        // 组装对话框
        content.appendChild(icon);
        content.appendChild(messageEl);
        content.appendChild(button);
        dialog.appendChild(content);
        modal.appendChild(dialog);
        
        // 添加到页面
        document.body.appendChild(modal);
        
        // 5秒后自动关闭
        setTimeout(() => {
            button.click();
        }, 5000);
    }

    updateSectionScores(moduleId) {
        const module = document.getElementById(`module-${moduleId}`);
        if (!module) {
            console.warn(`模块 ${moduleId} 不存在，无法更新分数`);
            return;
        }
        
        // 不再自动清理负值，只跳过负值计算
        
        const sectionScores = module.querySelectorAll('.section-score');
        if (sectionScores.length === 0) {
            console.warn(`模块 ${moduleId} 中未找到得分元素`);
            return;
        }
        
        console.log(`模块 ${moduleId} 中找到 ${sectionScores.length} 个得分元素，开始更新分数`);
        
        sectionScores.forEach((scoreElement, index) => {
            try {
                // 直接查找父级的scoring-section元素
                let section = scoreElement.closest('.scoring-section');
                if (!section) {
                    // 如果closest没有找到，尝试向上查找
                    let parent = scoreElement.parentElement;
                    while (parent && !parent.classList.contains('scoring-section')) {
                        parent = parent.parentElement;
                    }
                    section = parent;
                }
                
                if (section) {
                    const score = this.calculateSectionScore(section);
                    console.log(`第 ${index + 1} 个得分元素，计算得分: ${score}`);
                    scoreElement.textContent = `得分: ${score}`;
                } else {
                    console.warn(`第 ${index + 1} 个得分元素，未找到父级section`);
                }
            } catch (error) {
                console.error(`更新第 ${index + 1} 个得分元素时出错:`, error);
            }
        });
        
        console.log(`模块 ${moduleId} 分数更新完成`);
    }
    
    // 重置指定评分项的所有得分
    resetSectionScores(sectionId, moduleId) {
        if (!sectionId || !moduleId) return;
        
        console.log(`开始重置评分项: sectionId=${sectionId}, moduleId=${moduleId}`);
        
        // 找到对应的section元素
        const module = document.getElementById(`module-${moduleId}`);
        if (!module) {
            console.log(`未找到模块: module-${moduleId}`);
            return;
        }
        
        const section = module.querySelector(`[data-section-id="${sectionId}"]`)?.closest('.scoring-section');
        if (!section) {
            console.log(`未找到section: data-section-id="${sectionId}"`);
            return;
        }
        
        console.log(`找到section:`, section);
        
        // 特殊处理：重置条件选择器为默认值
        const conditionalSelects = section.querySelectorAll('select[data-item-id="depth_type_selector"], select[data-item-id="atmospheric_type_selector"]');
        conditionalSelects.forEach(select => {
            const itemId = select.getAttribute('data-item-id');
            console.log(`重置条件选择器 ${itemId} 为默认值`);
            
            // 重置为"请选择"选项（空值）
            select.value = '';
            
            // 隐藏条件内容容器
            const section = select.closest('.scoring-section');
            const contentContainer = section.querySelector('.conditional-content');
            if (contentContainer) {
                contentContainer.style.display = 'none';
                contentContainer.innerHTML = '';
                console.log(`隐藏条件选择器 ${itemId} 的内容容器`);
            }
            
            // 触发change事件
            setTimeout(() => select.dispatchEvent(new Event('change', { bubbles: true })), 0);
        });
        
        // 重置该section中所有下拉框的选择为"最高值"（前三个模块+安全）或"最低值"（失效后果）；固定选项跳过
        const selects = section.querySelectorAll('.option-select');
        const preferHighest = moduleId !== 'consequence';
        console.log(`找到 ${selects.length} 个下拉框，策略=${preferHighest ? '最高值' : '最低值'}`);

        selects.forEach((select, index) => {
            const itemId = select.getAttribute('data-item-id') || '';
            
            if (select.hasAttribute('data-fixed')) {
                console.log(`跳过固定选项: ${itemId}`);
                return;
            }
            
            // 跳过已经处理的条件选择器
            if (itemId === 'depth_type_selector' || itemId === 'atmospheric_type_selector') {
                console.log(`跳过已处理的条件选择器: ${itemId}`);
                return;
            }
            let chosenValue = '';
            let bestScore = preferHighest ? -Infinity : Infinity;
            // 特例：D.5.2.4.9 强度试验已改为输入框，跳过旧的下拉选择器重置逻辑
            if (false && itemId === 'strength1') {
                // 还原“参照附件”文本与分数痕迹
                const optC = Array.from(select.options).find(o => o.value === 'strength1c');
                if (optC) {
                    if (optC.dataset && optC.dataset.baseText) {
                        optC.textContent = optC.dataset.baseText;
                    }
                    if (optC.dataset) {
                        delete optC.dataset.score;
                    }
                }
                // 清空隐藏输入框值，避免计分
                const hid = document.querySelector('#safety-strength1');
                if (hid) hid.value = '';
                select.value = 'strength1b';
                // 直接调用统一处理逻辑并强制刷新当前模块分数
                try {
                    this.handleScoreChange(select);
                    this.updateSectionScores('safety');
                    this.updateModuleScore('safety');
                } catch (e) {
                    console.warn('重置strength1时刷新失败：', e);
                }
                return;
            }
            Array.from(select.options).forEach(opt => {
                if (!opt.value) return; // 跳过占位
                const ds = opt.dataset ? opt.dataset.score : undefined;
                if (ds === undefined || ds === null || ds === 'null') return;
                const s = parseFloat(ds);
                if (isNaN(s)) return;
                if (preferHighest ? (s > bestScore) : (s < bestScore)) {
                    bestScore = s;
                    chosenValue = opt.value;
                }
            });
            if (chosenValue) {
                select.value = chosenValue;
            } else if (select.options.length > 0) {
                // 兜底：选第一个非空选项
                const fv = Array.from(select.options).find(o => o.value);
                select.value = fv ? fv.value : '';
            }
            setTimeout(() => select.dispatchEvent(new Event('change', { bubbles: true })), 0);
        });
        
        // 重置该section中所有输入框的值（数值输入：按策略选择最大/最小；无法判断时用defaultValue）
        const inputs = section.querySelectorAll('.option-input');
        inputs.forEach(input => {
            const itemId = input.getAttribute('data-item-id');
            if (itemId) {
                // 特例：D.2.3.3 非水下穿越-埋地段 输入框重置为未计算状态
                if (itemId === 'depth1b') {
                    input.value = '';
                    try { input.type = 'number'; } catch(e) {}
                    input.placeholder = '请输入0-8之间的数值，根据实际埋深评分';
                    input.step = 'any';
                // 特例：D.5.2.5 附加安全裕度需要回到"未计算"空状态
                } else if (itemId === 'safetyMargin1') {
                    input.value = '';
                    try { input.type = 'number'; } catch(e) {}
                    input.placeholder = '请输入0-2之间的数值，附加安全裕度小于0时，失效可能性为100';
                    if (input.dataset) {
                        delete input.dataset.s100;
                    }
                } else {
                    // 其他数值输入：优先根据min/max选择
                    const min = (input.min !== undefined && input.min !== '') ? parseFloat(input.min) : null;
                    const max = (input.max !== undefined && input.max !== '') ? parseFloat(input.max) : null;
                    if (preferHighest && max !== null && !isNaN(max)) {
                        input.value = String(max);
                    } else if (!preferHighest && min !== null && !isNaN(min)) {
                        input.value = String(min);
                    } else if (typeof input.defaultValue !== 'undefined') {
                        input.value = input.defaultValue;
                    } else {
                        input.value = '';
                    }
                }
                setTimeout(() => input.dispatchEvent(new Event('input', { bubbles: true })), 0);
            } else {
                input.value = '';
                setTimeout(() => input.dispatchEvent(new Event('input', { bubbles: true })), 0);
            }
        });
        
        // 清空该section相关的得分
        if (this.scores[moduleId]) {
            // 找到该section下的所有item id并清空
            const items = section.querySelectorAll('[data-item-id]');
            items.forEach(item => {
                const itemId = item.getAttribute('data-item-id');
                if (itemId && this.scores[moduleId][itemId] !== undefined) {
                    delete this.scores[moduleId][itemId];
                }
            });
        }
        
        // 更新分数显示
        this.updateSectionScores(moduleId);
        this.updateModuleScore(moduleId);
        
        // 显示重置成功提示
        this.showNotification(`已重置评分项的所有得分到默认选项`, 'success');
    }
    
    // 获取指定项目的默认选项
    getDefaultOptionForItem(itemId, moduleId) {
        console.log(`获取默认选项: itemId=${itemId}, moduleId=${moduleId}`);
        
        // 目前只实现了第三方破坏模块，其他模块暂时返回null
        if (moduleId === 'third_party') {
            const scoringData = this.getThirdPartyScoringData();
            console.log(`获取第三方破坏模块评分数据:`, scoringData);
            const result = this.findItemDefaultOption(scoringData, itemId);
            console.log(`查找结果: ${result}`);
            return result;
        }
        
        console.log(`模块 ${moduleId} 暂未实现，返回null`);
        return null;
    }
    
    // 获取指定项目的默认值
    getDefaultValueForItem(itemId, moduleId) {
        // 目前只实现了第三方破坏模块，其他模块暂时返回null
        if (moduleId === 'third_party') {
            const scoringData = this.getThirdPartyScoringData();
            return this.findItemDefaultValue(scoringData, itemId);
        }
        return null;
    }
    
    // 递归查找项目的默认选项
    findItemDefaultOption(data, itemId) {
        for (const section of data) {
            if (section.items) {
                for (const item of section.items) {
                    if (item.id === itemId && item.selected) {
                        return item.selected;
                    }
                }
            }
            if (section.subitems) {
                for (const subitem of section.subitems) {
                    if (subitem.items) {
                        for (const item of subitem.items) {
                            if (item.id === itemId && item.selected) {
                                return item.selected;
                            }
                        }
                    }
                }
            }
            if (section.tabs) {
                for (const tab of section.tabs) {
                    if (tab.content && tab.content.items) {
                        for (const item of tab.content.items) {
                            if (item.id === itemId && item.selected) {
                                return item.selected;
                            }
                        }
                    }
                    if (tab.content && tab.content.subitems) {
                        for (const subitem of tab.content.subitems) {
                            if (subitem.items) {
                                for (const item of subitem.items) {
                                    if (item.id === itemId && item.selected) {
                                        return item.selected;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
    
    // 递归查找项目的默认值
    findItemDefaultValue(data, itemId) {
        for (const section of data) {
            if (section.items) {
                for (const item of section.items) {
                    if (item.id === itemId && item.defaultValue !== undefined) {
                        return item.defaultValue;
                    }
                }
            }
            if (section.subitems) {
                for (const subitem of section.subitems) {
                    if (subitem.items) {
                        for (const item of subitem.items) {
                            if (item.id === itemId && item.defaultValue !== undefined) {
                                return item.defaultValue;
                            }
                        }
                    }
                }
            }
            if (section.tabs) {
                for (const tab of section.tabs) {
                    if (tab.content && tab.content.items) {
                        for (const item of tab.content.items) {
                            if (item.id === itemId && item.defaultValue !== undefined) {
                                return item.defaultValue;
                            }
                        }
                    }
                    if (tab.content && tab.content.subitems) {
                        for (const subitem of tab.content.subitems) {
                            if (subitem.items) {
                                for (const item of subitem.items) {
                                    if (item.id === itemId && item.defaultValue !== undefined) {
                                        return item.defaultValue;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    calculateSectionScore(section) {
        const startTime = performance.now();
        let totalScore = 0;
        // 若存在选项卡，仅统计激活选项卡内的控件
        let scope = section;
        const activeTabContent = section.querySelector('.tabs-content .tab-content.active');
        if (activeTabContent) {
            scope = activeTabContent;
        }
        const selects = scope.querySelectorAll('.option-select');
        const inputs = scope.querySelectorAll('.option-input');
        
        console.log(`计算section得分，找到 ${selects.length} 个选择器，${inputs.length} 个输入框`);
        
        // 检查该section所属的模块ID
        const moduleId = this.getModuleIdFromSection(section);
        
        // 检查是否处于S=100状态，如果是，则返回满分
        if (this.isInS100State() && this.shouldShowFullScore(moduleId)) {
            const maxScore = this.getSectionMaxScore(section);
            console.log(`模块 ${moduleId} 处于S=100状态，显示满分: ${maxScore}`);
            return maxScore;
        }
        
        // 处理选择器分数
        selects.forEach((select, index) => {
            try {
                if (select.value && select.selectedOptions[0] && select.selectedOptions[0].dataset.score) {
                    const score = select.selectedOptions[0].dataset.score;
                    
                    // 跳过null分数的选项（高风险选项不参与得分计算）
                    if (score === null || score === 'null') {
                        console.log(`选择器 ${index + 1}: 值=${select.value}, 得分=${score} (高风险选项，不参与得分计算)`);
                    } else {
                        const numericScore = parseFloat(score);
                        if (!isNaN(numericScore)) {
                            totalScore += numericScore;
                            console.log(`选择器 ${index + 1}: 值=${select.value}, 得分=${numericScore}, 累计=${totalScore}`);
                        }
                    }
                } else {
                    console.log(`选择器 ${index + 1}: 值=${select.value}, 未选择或无效`);
                }
            } catch (error) {
                console.error(`处理选择器 ${index + 1} 时出错:`, error);
            }
        });
        
        // 处理输入框类型的分数
        inputs.forEach((input, index) => {
            try {
                const value = parseFloat(input.value);
                if (!isNaN(value)) {
                    // 特殊处理D.5.2.5附加安全裕度：负值不参与得分计算
                    if (this.isAdditionalSafetyMarginField(input) && value < 0) {
                        console.log(`D.5.2.5附加安全裕度分值为负数(${value})，不计入总分，但保留输入框显示`);
                        // 不加到总分中，但不清空输入框
                        return;
                    } else {
                        totalScore += value;
                        console.log(`输入框 ${index + 1}: 值=${input.value}, 得分=${value}, 累计=${totalScore}`);
                    }
                }
            } catch (error) {
                console.error(`处理输入框 ${index + 1} 时出错:`, error);
            }
        });
        
        const endTime = performance.now();
        console.log(`最终得分: ${totalScore}，计算耗时: ${(endTime - startTime).toFixed(2)}ms`);
        return totalScore;
    }
    
    // 获取section所属的模块ID
    getModuleIdFromSection(section) {
        let parent = section.parentElement;
        while (parent) {
            if (parent.id && parent.id.startsWith('module-')) {
                return parent.id.replace('module-', '');
            }
            parent = parent.parentElement;
        }
        return null;
    }
    
    // 检查模块是否被锁定
    isModuleLocked(moduleId) {
        if (!moduleId) return false;
        
        const module = document.getElementById(`module-${moduleId}`);
        if (!module) return false;
        
        // 检查是否有锁定提示
        return module.querySelector('.module-locked-notice') !== null;
    }
    
    // 检查是否有任何模块被锁定（失效后果模块除外）
    isAnyModuleLocked() {
        // 不再检查模块是否被锁定，因为不再锁定其他模块
        // const checkModules = ['third_party', 'corrosion', 'equipment', 'safety']; // 排除consequence模块
        // return checkModules.some(moduleId => this.isModuleLocked(moduleId));
        return false; // 始终返回false，因为不再锁定其他模块
    }
    
    // 验证附加安全裕度分值的有效性
    validateSafetyMarginScore(value) {
        if (isNaN(value)) {
            console.error('附加安全裕度分值无效：请输入有效的数值');
            return false;
        }
        
        if (value < 0) {
            console.warn(`附加安全裕度分值为负数(${value})，该值将被忽略，不计入总分`);
            return false;
        }
        
        if (value > 2) {
            console.warn(`附加安全裕度分值超出范围(${value})，最大值应为2`);
            return false;
        }
        
        console.log(`附加安全裕度分值 ${value} 验证通过`);
        return true;
    }
    
    // 获取有效的附加安全裕度分值
    getValidSafetyMarginScore() {
        if (this.scores.safety && this.scores.safety.safetyMargin1 !== undefined) {
            const value = this.scores.safety.safetyMargin1;
            if (this.validateSafetyMarginScore(value)) {
                return value;
            }
        }
        return 0; // 如果没有有效值，返回0
    }
    
    // 检查是否处于S=100状态
    isInS100State() {
        const specialOptions = this.checkSpecialOptionsForFailureProbability();
        const isS100 = specialOptions.length > 0;
        console.log(`S=100状态检查: 特殊选项数量=${specialOptions.length}, 结果=${isS100}`, specialOptions);
        return isS100;
    }
    
    // 判断是否应该显示满分
    shouldShowFullScore(moduleId) {
        // 当S=100时，以下模块显示满分（管道本质安全评估模块除外，继续显示正常分数）
        const fullScoreModules = ['third_party', 'corrosion', 'equipment'];
        const shouldShow = fullScoreModules.includes(moduleId);
        console.log(`模块 ${moduleId} 是否显示满分: ${shouldShow}`);
        return shouldShow;
    }
    
    // 获取section的最大分数
    getSectionMaxScore(section) {
        // 查找section的最大分数配置
        const maxScoreElement = section.querySelector('[data-max-score]');
        if (maxScoreElement) {
            return parseFloat(maxScoreElement.dataset.maxScore);
        }
        
        // 如果没有配置，尝试从标题中解析
        const sectionTitle = section.querySelector('.section-title');
        if (sectionTitle) {
            const titleText = sectionTitle.textContent;
            const maxScoreMatch = titleText.match(/评分.*?(\d+(?:\.\d+)?)分/);
            if (maxScoreMatch) {
                return parseFloat(maxScoreMatch[1]);
            }
        }
        
        // 默认返回0
        return 0;
    }
    
    // 获取模块的最大分数
    getModuleMaxScore(moduleId) {
        // 定义各模块的最大分数
        const moduleMaxScores = {
            'third_party': 100,    // 第三方破坏模块最大分数
            'corrosion': 100,      // 腐蚀模块最大分数
            'equipment': 100,      // 设备及操作模块最大分数
            'safety': 100,         // 管道本质安全模块最大分数
            'consequence': 100     // 失效后果模块最大分数
        };
        
        return moduleMaxScores[moduleId] || 0;
    }
    
    // 创建埋地段计算器窗口
    createDepthCalculator() {
        // 移除已存在的计算器
        const existingCalculator = document.getElementById('depth-calculator');
        if (existingCalculator) {
            existingCalculator.remove();
        }
        
        // 创建计算器容器
        const calculator = document.createElement('div');
        calculator.id = 'depth-calculator';
        calculator.className = 'depth-calculator';
        calculator.style.cssText = 'display: flex; flex-direction: column; height: 85vh; max-height: 90vh; min-height: 500px;';
        calculator.innerHTML = `
            <div class="calculator-header">
                <h3>埋地段计算器</h3>
                <button class="close-btn" onclick="this.closest('.depth-calculator').remove()">×</button>
            </div>
            <div class="calculator-content" style="flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;">

                <div class="input-group">
                    <label for="d1-input">d1（设计规范要求的覆土层最小厚度，mm）:</label>
                    <select id="d1-input">
                        <option value="" selected>请选择d1</option>
                        <option value="900">埋设在机动车道下时，不得小于0.9m</option>
                        <option value="600">埋设在非机动车车道(含人行道)下时，不得小于0.6m</option>
                        <option value="300">埋设在机动车不可能到达的地方时，不得小于0.3m</option>
                        <option value="800">埋设在水田下时，不得小于0.8m</option>
                    </select>
                </div>
                <div class="input-group">
                    <label for="d3-input">d3（实际的覆土层厚度，mm）:</label>
                    <input type="number" id="d3-input" placeholder="请输入d3值" step="50" min="0">
                </div>
                <div style="font-size: 12px; color: #6b7280; margin: 6px 0 14px 0; line-height: 1.6; text-align: left;">
                    <div style="margin-bottom: 4px; font-weight: 600; color: #374151;">说明:</div>
                    <ul style="margin: 0; padding-left: 18px;">
                        <li>① 每50 mm水泥保护层相当于增加200 mm的覆土厚度</li>
                        <li>② 每100 mm水泥保护层相当于增加300 mm的覆土厚度</li>
                        <li>③ 管道套管相当于增加600 mm的覆土厚度</li>
                        <li>④ 加强水泥盖板相当于增加600 mm的覆土厚度</li>
                        <li>⑤ 警告标志带相当于增加150 mm覆土厚度</li>
                        <li>⑥ 网栏围住相当于增加460 mm覆土厚度</li>
                    </ul>
                </div>
                <div class="result-group">
                    <label>计算结果:</label>
                    <div id="calculation-result" class="result-display">等待输入...</div>
                </div>
                <div class="button-group">
                    <button id="apply-btn" class="apply-btn" disabled>应用结果</button>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(calculator);
        
        // 添加事件监听器
        this.setupCalculatorEvents(calculator);
        
        // 显示计算器
        setTimeout(() => {
            calculator.classList.add('show');
        }, 10);
        
        return calculator;
    }
    
    // 设置计算器事件
    setupCalculatorEvents(calculator) {
        const d1Input = calculator.querySelector('#d1-input');
        const d3Input = calculator.querySelector('#d3-input');
        const applyBtn = calculator.querySelector('#apply-btn');
        const resultDisplay = calculator.querySelector('#calculation-result');
        
        // 自动计算函数
        const autoCalculate = () => {
            const d1 = parseFloat(d1Input.value);
            const d3 = parseFloat(d3Input.value);
            
            // 检查是否两个输入框都有值
            const hasD1 = !isNaN(d1) && d1Input.value !== '';
            const hasD3 = !isNaN(d3) && d3Input.value.trim() !== '';
            
            // 如果两个输入框都没有值，显示等待输入
            if (!hasD1 && !hasD3) {
                resultDisplay.textContent = '等待输入d1和d3值...';
                resultDisplay.className = 'result-display';
                applyBtn.disabled = true;
                return;
            }
            
            // 如果只有一个输入框有值，显示等待另一个输入
            if (!hasD1 || !hasD3) {
                resultDisplay.textContent = '请输入d1和d3值进行计算';
                resultDisplay.className = 'result-display';
                applyBtn.disabled = true;
                return;
            }
            
            if (d1 < 0 || d3 < 0) {
                resultDisplay.textContent = '数值不能为负数';
                resultDisplay.className = 'result-display error';
                applyBtn.disabled = true;
                return;
            }
            
            // 计算埋地段分数
            const score = this.calculateDepthScore(d1, d3);
            
            // 显示详细的计算结果
            const d1MinusD3 = d1 - d3;
            let calculationFormula;
            
            if (d1MinusD3 < 0) {
                // 当 (d1 - d3) < 0 时，显示条件判断后的计算过程
                calculationFormula = `8 × (1 - (${d1} - ${d3})/${d1}) = 8 × (1 - 0/${d1}) = 8 × (1 - 0) = 8 × 1 = ${score}分`;
            } else {
                // 正常情况下的计算过程
                const d1MinusD3Ratio = (d1MinusD3 / d1).toFixed(6);
                calculationFormula = `8 × (1 - (${d1} - ${d3})/${d1}) = 8 × (1 - ${d1MinusD3}/${d1}) = 8 × (1 - ${d1MinusD3Ratio}) = ${score}分`;
            }
            
            resultDisplay.innerHTML = `
                <div style="text-align: left; line-height: 1.5;">
                    <div><strong>最终得分: ${score}分</strong></div>
                    <div style="font-size: 12px; color: #6b7280; margin-top: 8px;">
                        计算公式: ${calculationFormula}
                    </div>
                </div>
            `;
            resultDisplay.className = 'result-display success';
            applyBtn.disabled = false;
            
            // 保存计算结果
            calculator.dataset.calculatedScore = score;
            calculator.dataset.d1 = d1;
            calculator.dataset.d3 = d3;
        };
        
        // 输入框自动计算事件
        d1Input.addEventListener('input', autoCalculate);
        d3Input.addEventListener('input', autoCalculate);
        
        // 应用结果按钮事件
        applyBtn.addEventListener('click', () => {
            const score = parseFloat(calculator.dataset.calculatedScore);
            const d1 = parseFloat(calculator.dataset.d1);
            const d3 = parseFloat(calculator.dataset.d3);
            
            // 将结果应用到对应的输入框
            this.applyDepthCalculation(score, d1, d3);
            
            // 关闭计算器
            calculator.remove();
        });
        
        // 回车键触发计算
        [d1Input, d3Input].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    autoCalculate();
                }
            });
        });
    }

    // 创建强度试验计算器窗口（样式复用埋地段计算器）
    createStrengthCalculator() {
        const existing = document.getElementById('strength-calculator');
        if (existing) existing.remove();

        const calculator = document.createElement('div');
        calculator.id = 'strength-calculator';
        calculator.className = 'depth-calculator';
        calculator.style.cssText = 'display: flex; flex-direction: column; height: 85vh; max-height: 90vh; min-height: 500px;';
        calculator.innerHTML = `
            <div class="calculator-header">
                <h3>D.5.2.4.9 强度试验计算器</h3>
                <button class="close-btn" onclick="this.closest('.depth-calculator').remove()">×</button>
            </div>
            <div class="calculator-content" style="flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;">
                <div class="input-group">
                    <label for="p2-input">P2（管道强度试验压力，MPa）</label>
                    <input type="number" id="p2-input" class="option-input" step="any" placeholder="请输入P2">
                </div>
                <div class="input-group">
                    <label for="pmax-input">Pmax（管道组成件的最大允许工作压力，MPa）</label>
                    <input type="number" id="pmax-input" class="option-input" step="any" placeholder="请输入Pmax">
                </div>
                <div class="input-group">
                    <label for="y-input">y（上次强度试验至本次风险评估的年数）</label>
                    <input type="number" id="y-input" class="option-input" step="1" min="0" placeholder="请输入y">
                </div>
                <div class="result-group">
                    <label>计算结果</label>
                    <div class="result-display" id="strength-calculation-result">—</div>
                </div>
                <div class="button-group">
                    <button class="apply-btn" id="strength-apply-btn" disabled>应用结果</button>
                </div>
            </div>
        `;

        document.body.appendChild(calculator);
        setTimeout(() => calculator.classList.add('show'), 10);

        // 事件
        const p2 = calculator.querySelector('#p2-input');
        const pmax = calculator.querySelector('#pmax-input');
        const y = calculator.querySelector('#y-input');
        const applyBtn = calculator.querySelector('#strength-apply-btn');
        const resultEl = calculator.querySelector('#strength-calculation-result');

        const compute = () => {
            const vP2 = parseFloat(p2.value);
            const vPmax = parseFloat(pmax.value);
            const vY = parseFloat(y.value);
            if (isNaN(vP2) || isNaN(vPmax) || isNaN(vY) || vP2 < 0 || vPmax <= 0 || vY < 0) {
                resultEl.textContent = '请输入有效数值';
                resultEl.classList.remove('success');
                applyBtn.disabled = true;
                return null;
            }
            // 计算规则（正式）：
            // y > 10 时，取 y = 10
            const yCapped = Math.min(10, vY);
            // 强度试验得分 = 3 - 1.8 * (3 - 2*P2/Pmax) - 0.12*y
            const strengthRaw = 3 - 1.8 * (3 - (2 * vP2 / vPmax)) - 0.12 * yCapped;
            // RBI得分 = IFS( <0 => 0, >3 => 3, between 0..3 => 原值 )
            let score = strengthRaw;
            score = Math.max(0, Math.min(3, score));
            const rounded = Math.round(score * 100) / 100;
            const p2s = (Math.round(vP2 * 1000) / 1000).toString();
            const pmaxs = (Math.round(vPmax * 1000) / 1000).toString();
            const ys = (Math.round(yCapped * 1000) / 1000).toString();
            const note = (vY > 10) ? `（y 超过 10，按 y=10 计）` : '';
            const formulaHtml = `
                <div style="text-align: left; line-height: 1.5;">
                    <div><strong>最终得分: ${rounded}分</strong></div>
                    <div style="font-size: 12px; color: #065f46; margin-top: 8px;">
                        计算公式: 3 - 1.8 × (3 - 2×P2/Pmax) - 0.12 × y = 3 - 1.8 × (3 - 2×${p2s}/${pmaxs}) - 0.12 × ${ys} ${note} = ${rounded}
                    </div>
                </div>`;
            resultEl.innerHTML = formulaHtml;
            resultEl.classList.add('success');
            applyBtn.disabled = false;
            return rounded;
        };

        // 自动计算：任一输入变化即计算
        [p2, pmax, y].forEach(el => el.addEventListener('input', () => {
            compute();
        }));

        // 初始化一次，显示提示或结果
        compute();

        applyBtn.addEventListener('click', () => {
            const score = compute();
            if (score == null) return;
            const strengthInput = document.querySelector('input[data-item-id="strength1"]');
            if (strengthInput) {
                strengthInput.value = score;
                const event = new Event('input', { bubbles: true });
                strengthInput.dispatchEvent(event);
            }
            calculator.remove();
        });
    }

    
    // 计算埋地段分数
    calculateDepthScore(d1, d3) {
        // 根据公式：埋深评分 = 8 * (1 - (d1 - d3) / d1)
        // 条件判断：如果 (d1 - d3) < 0，则将 (d1 - d3) 设为 0 继续计算
        
        // 防止除零错误
        if (d1 <= 0) {
            console.warn('d1值不能为0或负数');
            return 0;
        }
        
        // 计算 (d1 - d3)
        let d1MinusD3 = d1 - d3;
        
        // 应用条件判断：如果 (d1 - d3) < 0，则将 (d1 - d3) 设为 0
        if (d1MinusD3 < 0) {
            console.log(`条件判断: (d1 - d3) = ${d1} - ${d3} = ${d1MinusD3} < 0，将 (d1 - d3) 设为 0 继续计算`);
            d1MinusD3 = 0;
        }
        
        // 计算基础分数
        const baseScore = 8 * (1 - d1MinusD3 / d1);
        
        console.log(`埋深计算: d1=${d1}, d3=${d3}`);
        if (d1MinusD3 === 0) {
            console.log(`条件判断: (d1 - d3) < 0，已将 (d1 - d3) 设为 0`);
            console.log(`基础计算: 8 * (1 - 0/${d1}) = 8 * (1 - 0) = 8 * 1 = 8分`);
        } else {
            console.log(`条件判断: (d1 - d3) = ${d1} - ${d3} = ${d1MinusD3} >= 0，正常计算`);
            console.log(`基础计算: 8 * (1 - ${d1MinusD3}/${d1}) = 8 * (1 - ${(d1MinusD3/d1).toFixed(6)}) = 8 * ${(1 - d1MinusD3/d1).toFixed(6)} = ${baseScore.toFixed(6)}`);
        }
        
        // 计算结果四舍五入取整
        const roundedScore = Math.round(baseScore);
        return roundedScore;
    }
    
    // 应用计算结果到输入框
    applyDepthCalculation(score, d1, d3) {
        // 查找埋地段相关的输入框
        const depthInputs = document.querySelectorAll('input[id*="depth"], input[placeholder*="埋深"], input[placeholder*="覆土"]');
        
        if (depthInputs.length > 0) {
            // 找到第一个匹配的输入框
            const targetInput = depthInputs[0];
            targetInput.value = score;
            targetInput.removeAttribute('min');
            targetInput.removeAttribute('required');
            targetInput.step = 'any';
            
            // 清除任何验证错误状态
            targetInput.setCustomValidity('');
            targetInput.classList.remove('error', 'invalid');
            
            // 移除红色边框样式
            targetInput.style.borderColor = '';
            targetInput.style.boxShadow = '';
            
            // 触发输入事件以更新分数
            targetInput.dispatchEvent(new Event('input'));
            
            console.log(`埋地段计算结果已应用: 得分=${score}, d1=${d1}, d3=${d3}`);
        } else {
            console.warn('未找到埋地段相关的输入框');
        }
    }
    
    // 清理无效的附加安全裕度分值
    cleanupInvalidSafetyMarginScore() {
        if (this.scores.safety && this.scores.safety.safetyMargin1 !== undefined) {
            const value = this.scores.safety.safetyMargin1;
            if (!this.validateSafetyMarginScore(value)) {
                console.log(`清理无效的附加安全裕度分值: ${value}`);
                delete this.scores.safety.safetyMargin1;
                return true; // 表示进行了清理
            }
        }
        return false; // 表示没有进行清理
    }
    
    // 获取所有有效的分值（排除负数的附加安全裕度）
    getValidScores(moduleId) {
        const validScores = {};
        
        if (this.scores[moduleId]) {
            for (let [itemId, score] of Object.entries(this.scores[moduleId])) {
                // 过滤掉负数的附加安全裕度分值
                if (itemId === 'safetyMargin1' && score < 0) {
                    console.log(`跳过负数的附加安全裕度分值: ${score}`);
                    continue;
                }
                validScores[itemId] = score;
            }
        }
        
        return validScores;
    }
    
    // 判断是否为D.5.2.5附加安全裕度字段的方法
    isAdditionalSafetyMarginField(inputElement) {
        // 方法1：通过ID判断
        if (inputElement.id === 'safetyMargin1' || inputElement.id === 'safety-safetyMargin1') {
            return true;
        }
        
        // 方法1.5：通过data-item-id属性判断
        if (inputElement.getAttribute('data-item-id') === 'safetyMargin1') {
            return true;
        }
        
        // 方法2：通过父元素的标题判断
        const parentItem = inputElement.closest('.scoring-item');
        if (parentItem) {
            const title = parentItem.querySelector('.item-title');
            if (title && title.textContent.includes('D.5.2.5')) {
                return true;
            }
            if (title && title.textContent.includes('附加安全裕度')) {
                return true;
            }
        }
        
        // 方法3：通过父级section的标题判断
        const parentSection = inputElement.closest('.scoring-section');
        if (parentSection) {
            const sectionTitle = parentSection.querySelector('.section-title');
            if (sectionTitle && sectionTitle.textContent.includes('D.5.2.5')) {
                return true;
            }
            if (sectionTitle && sectionTitle.textContent.includes('附加安全裕度')) {
                return true;
            }
        }
        
        // 方法4：通过data属性判断
        if (inputElement.dataset.field === 'D.5.2.5' || 
            inputElement.dataset.type === 'additionalSafetyMargin') {
            return true;
        }
        
        return false;
    }
    
            // 强制更新所有分数显示
        forceUpdateAllScores() {
            const modules = ['third_party', 'corrosion', 'equipment', 'safety', 'consequence'];
            console.log('开始强制更新所有模块分数...');
            
            modules.forEach(moduleId => {
                try {
                    const module = document.getElementById(`module-${moduleId}`);
                    if (!module) {
                        console.warn(`模块 ${moduleId} 不存在，跳过`);
                        return;
                    }
                    
                    console.log(`正在更新模块 ${moduleId} 的分数...`);
                    this.updateSectionScores(moduleId);
                } catch (error) {
                    console.error(`更新模块 ${moduleId} 分数时出错:`, error);
                }
            });
            
            console.log('所有模块分数更新完成');
        }
}

// 页面加载完成后初始化系统
document.addEventListener('DOMContentLoaded', () => {
    // 强制添加移动端样式重置，确保完全移除蓝色边框
    const style = document.createElement('style');
    style.id = 'mobile-reset-styles';
    style.textContent = `
        * {
            -webkit-tap-highlight-color: transparent !important;
            -webkit-user-select: none;
            -webkit-touch-callout: none;
        }
        input, select, button, textarea {
            -webkit-tap-highlight-color: transparent !important;
            -webkit-appearance: none !important;
            outline: none !important;
            -webkit-focus-ring-color: transparent !important;
        }
        input:focus, select:focus, button:focus, textarea:focus,
        input:focus-visible, select:focus-visible, button:focus-visible, textarea:focus-visible,
        input:active, select:active, button:active, textarea:active {
            outline: 0 !important;
            outline-width: 0 !important;
            outline-style: none !important;
            outline-color: transparent !important;
            outline-offset: 0 !important;
            border: 1px solid #d1d5db !important;
            box-shadow: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            -webkit-focus-ring-color: transparent !important;
        }
        .option-select, .option-input {
            border: 1px solid #d1d5db !important;
            outline: none !important;
            box-shadow: none !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            -webkit-focus-ring-color: transparent !important;
        }
        .option-select:focus, .option-input:focus,
        .option-select:focus-visible, .option-input:focus-visible,
        .option-select:active, .option-input:active {
            border: 1px solid #d1d5db !important;
            outline: none !important;
            box-shadow: none !important;
            -webkit-appearance: none !important;
            -webkit-focus-ring-color: transparent !important;
        }
    `;
    document.head.appendChild(style);
    
    new RBIAssessmentSystem();
});
// ================== 失效可能性S=100特殊选项检查函数 ==================

// 检查可能导致S直接为100的条件
function checkForDirectS100Conditions(moduleScores) {
    const directS100Reasons = [];
    
    // 检查第三方破坏模块中的特定选项
    if (moduleScores.third_party) {
        const highRiskItems = checkHighRiskThirdPartyItems();
        if (highRiskItems.length > 0) {
            directS100Reasons.push(...highRiskItems);
        }
    }
    
    // 检查腐蚀模块
    if (moduleScores.corrosion) {
        const highRiskItems = checkHighRiskCorrosionItems();
        if (highRiskItems.length > 0) {
            directS100Reasons.push(...highRiskItems);
        }
    }
    
    // 检查设备及操作模块
    if (moduleScores.equipment) {
        const highRiskItems = checkHighRiskEquipmentItems();
        if (highRiskItems.length > 0) {
            directS100Reasons.push(...highRiskItems);
        }
    }
    
    // 检查管道本质安全模块
    if (moduleScores.safety) {
        const highRiskItems = checkHighRiskSafetyItems();
        if (highRiskItems.length > 0) {
            directS100Reasons.push(...highRiskItems);
        }
    }
    
    return directS100Reasons;
}

// 检查第三方破坏模块的高风险项
function checkHighRiskThirdPartyItems() {
    const reasons = [];
    
    // 检查地面活动水平
    const surfaceActivitySelect = document.querySelector('[data-item="surface_activity"] .option-select');
    if (surfaceActivitySelect && surfaceActivitySelect.value === '100') {
        const optionText = surfaceActivitySelect.options[surfaceActivitySelect.selectedIndex].text;
        reasons.push(`地面活动水平选择了"${optionText}"`);
    }
    
    // 检查埋深
    const burialDepthSelect = document.querySelector('[data-item="burial_depth"] .option-select');
    if (burialDepthSelect && burialDepthSelect.value === '100') {
        const optionText = burialDepthSelect.options[burialDepthSelect.selectedIndex].text;
        reasons.push(`埋深选择了"${optionText}"`);
    }
    
    // 检查占压情况
    const occupancySelect = document.querySelector('[data-item="occupancy"] .option-select');
    if (occupancySelect && occupancySelect.value === '100') {
        const optionText = occupancySelect.options[occupancySelect.selectedIndex].text;
        reasons.push(`占压情况选择了"${optionText}"`);
    }
    
    return reasons;
}

// 检查腐蚀模块的高风险项
function checkHighRiskCorrosionItems() {
    const reasons = [];
    
    // 检查大气腐蚀相关项
    const atmosphericCorrosionSelects = document.querySelectorAll('#module-corrosion [data-subitem="atmospheric"] .option-select');
    atmosphericCorrosionSelects.forEach(select => {
        if (select.value === '100') {
            const itemTitle = select.closest('.scoring-item').querySelector('.item-title').textContent;
            const optionText = select.options[select.selectedIndex].text;
            reasons.push(`大气腐蚀中"${itemTitle}"选择了"${optionText}"`);
        }
    });
    
    // 检查内腐蚀相关项
    const internalCorrosionSelects = document.querySelectorAll('#module-corrosion [data-subitem="internal"] .option-select');
    internalCorrosionSelects.forEach(select => {
        if (select.value === '100') {
            const itemTitle = select.closest('.scoring-item').querySelector('.item-title').textContent;
            const optionText = select.options[select.selectedIndex].text;
            reasons.push(`内腐蚀中"${itemTitle}"选择了"${optionText}"`);
        }
    });
    
    return reasons;
}

// 检查设备及操作模块的高风险项
function checkHighRiskEquipmentItems() {
    const reasons = [];
    
    const equipmentSelects = document.querySelectorAll('#module-equipment .option-select');
    equipmentSelects.forEach(select => {
        if (select.value === '100') {
            const itemTitle = select.closest('.scoring-item').querySelector('.item-title').textContent;
            const optionText = select.options[select.selectedIndex].text;
            reasons.push(`设备及操作中"${itemTitle}"选择了"${optionText}"`);
        }
    });
    
    return reasons;
}

// 检查管道本质安全模块的高风险项
function checkHighRiskSafetyItems() {
    const reasons = [];
    
    const safetySelects = document.querySelectorAll('#module-safety .option-select');
    safetySelects.forEach(select => {
        if (select.value === '100') {
            const itemTitle = select.closest('.scoring-item').querySelector('.item-title').textContent;
            const optionText = select.options[select.selectedIndex].text;
            reasons.push(`管道本质安全中"${itemTitle}"选择了"${optionText}"`);
        }
    });
    
    return reasons;
}

// 获取风险等级
function getRiskLevel(riskValue) {
    if (riskValue >= 8000) return '高风险';
    if (riskValue >= 4000) return '中高风险';
    if (riskValue >= 2000) return '中等风险';
    if (riskValue >= 1000) return '中低风险';
    return '低风险';
}

// 调试失效后果模块的分数计算
function debugConsequenceModuleScore() {
    console.log('=== 调试失效后果模块分数计算 ===');
    
    const module = document.getElementById('module-consequence');
    if (!module) {
        console.log('未找到失效后果模块');
        return;
    }
    
    // 检查所有scoring-section
    const sections = module.querySelectorAll('.scoring-section');
    console.log(`找到 ${sections.length} 个评分部分:`);
    
    let totalScore = 0;
    sections.forEach((section, index) => {
        const sectionTitle = section.querySelector('.section-title span:first-child')?.textContent?.trim();
        const sectionScore = section.querySelector('.section-score')?.textContent?.trim();
        
        console.log(`部分 ${index + 1}: ${sectionTitle} - ${sectionScore}`);
        
        // 计算该部分的实际分数
        const actualScore = calculateSectionScore(section);
        console.log(`  实际计算分数: ${actualScore}`);
        
        totalScore += actualScore;
    });
    
    console.log(`总计算分数: ${totalScore}`);
    
    // 检查导航栏显示的分数
    const navScore = document.querySelector('.nav-score[data-module="consequence"]');
    if (navScore) {
        console.log(`导航栏显示分数: ${navScore.textContent}`);
    }
    
    console.log('=== 调试完成 ===');
}