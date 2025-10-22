// グローバル変数
let formData = {};
let imageData = {};

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    updateLastUpdateDate();
    generateTransactionSections();
    bindEvents();
    updateDynamicFields();
});

// 最終更新日時を更新
function updateLastUpdateDate() {
    const now = new Date();
    const formatted = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    formData.lastUpdateDate = formatted;
    const field = document.querySelector('[data-field="lastUpdateDate"]');
    if (field) field.value = formatted;
}

// 取引内容セクション2-5の内容を生成
function generateTransactionSections() {
    for (let i = 2; i <= 5; i++) {
        const content = document.querySelector(`[data-section="${i}"] .accordion-content`);
        if (content) {
            content.innerHTML = generateTransactionContent(i);
        }
    }
}

// 取引内容の質問を生成
function generateTransactionContent(sectionNum) {
    return `
        <div class="question-row">
            <div class="question-title">1. 外貨送金か外貨受取か</div>
            <div class="question-input">
                <div class="radio-group">
                    <div class="radio-item">
                        <input type="radio" name="transactionType_${sectionNum}" value="外貨送金" data-field="transactionType_${sectionNum}" id="type-send-${sectionNum}">
                        <label for="type-send-${sectionNum}">外貨送金</label>
                    </div>
                    <div class="radio-item">
                        <input type="radio" name="transactionType_${sectionNum}" value="外貨受取" data-field="transactionType_${sectionNum}" id="type-receive-${sectionNum}">
                        <label for="type-receive-${sectionNum}">外貨受取</label>
                    </div>
                </div>
            </div>
            <div class="remarks-section">
                
                <textarea class="remarks-textarea" data-field="transaction_q1_${sectionNum}_comment" placeholder="備考（画像ペースト可）" onpaste="handlePaste(event, 'transaction_q1_${sectionNum}_image')"></textarea>
                <div class="image-thumbnails" data-images="transaction_q1_${sectionNum}_image"></div>
                
            </div>
        </div>

        <div class="question-row" data-dynamic="transaction_q2_${sectionNum}">
            <div class="question-title">2. 前払い等で輸入許可通知書が確認できない場合は、管理シートに記入した</div>
            <div class="question-input">
                <div class="radio-group">
                    <div class="radio-item">
                        <input type="radio" name="managementSheetFilled_${sectionNum}" value="はい" data-field="managementSheetFilled_${sectionNum}" id="mgmt-yes-${sectionNum}">
                        <label for="mgmt-yes-${sectionNum}">はい</label>
                    </div>
                    <div class="radio-item">
                        <input type="radio" name="managementSheetFilled_${sectionNum}" value="いいえ" data-field="managementSheetFilled_${sectionNum}" id="mgmt-no-${sectionNum}">
                        <label for="mgmt-no-${sectionNum}">いいえ</label>
                    </div>
                </div>
                <div class="input-group" style="margin-top: 8px;">
                    <label>提出可能日</label>
                    <input type="date" class="form-control" data-field="submissionDate_${sectionNum}">
                </div>
            </div>
            <div class="remarks-section">
                
                <textarea class="remarks-textarea" data-field="transaction_q2_${sectionNum}_comment" placeholder="備考（画像ペースト可）" onpaste="handlePaste(event, 'transaction_q2_${sectionNum}_image')"></textarea>
                <div class="image-thumbnails" data-images="transaction_q2_${sectionNum}_image"></div>
                
            </div>
        </div>

        <div class="question-row" data-dynamic="transaction_q3_${sectionNum}">
            <div class="question-title">3. 取引目的が申込企業の謄本記載の事業内容と関連性がある。</div>
            <div class="question-input">
                <div class="radio-group">
                    <div class="radio-item">
                        <input type="radio" name="transactionPurposeRelated_${sectionNum}" value="はい" data-field="transactionPurposeRelated_${sectionNum}" id="purpose-yes-${sectionNum}">
                        <label for="purpose-yes-${sectionNum}">はい</label>
                    </div>
                    <div class="radio-item">
                        <input type="radio" name="transactionPurposeRelated_${sectionNum}" value="いいえ" data-field="transactionPurposeRelated_${sectionNum}" id="purpose-no-${sectionNum}">
                        <label for="purpose-no-${sectionNum}">いいえ</label>
                    </div>
                </div>
                <div class="input-group">
                    <label>取引目的・品目</label>
                    <input type="text" class="form-control" data-field="transactionPurposeItems_1" placeholder="取引目的・品目">
                </div>                           
                <div class="nested-question">
                    <div style="font-size: 12px; margin-bottom: 6px;">取引内容が以下にあたらない（火薬品、仮想通貨、大麻、アダルトグッズ、ギャンブル性の高い商品（オンラインカジノ等））</div>
                    <div class="radio-group" style="margin-bottom: 8px;">
                        <div class="radio-item">
                            <input type="radio" name="transactionContentSafe_${sectionNum}" value="はい" data-field="transactionContentSafe_${sectionNum}" id="content-safe-yes-${sectionNum}">
                            <label for="content-safe-yes-${sectionNum}">はい</label>
                        </div>
                        <div class="radio-item">
                            <input type="radio" name="transactionContentSafe_${sectionNum}" value="いいえ" data-field="transactionContentSafe_${sectionNum}" id="content-safe-no-${sectionNum}">
                            <label for="content-safe-no-${sectionNum}">いいえ</label>
                        </div>
                    </div>
                </div>
            </div>
            <div class="remarks-section">
                
                <textarea class="remarks-textarea" data-field="transaction_q3_${sectionNum}_comment" placeholder="備考（画像ペースト可）" onpaste="handlePaste(event, 'transaction_q3_${sectionNum}_image')"></textarea>
                <div class="image-thumbnails" data-images="transaction_q3_${sectionNum}_image"></div>
                
            </div>
        </div>

        <div class="question-row">
            <div class="question-title">4. 取引先企業/関連企業/銀行/積載地/仕向地の所在国・地域が以下A、B、Cに該当しないことを確認する。</div>
            <div class="question-input">
                <div class="grid-2">
                    <div class="input-group">
                        <label>取引先企業</label>
                        <input type="text" class="form-control" data-field="partnerCompany_${sectionNum}" placeholder="取引先企業">
                    </div>
                    <div class="input-group">
                        <label>関連企業</label>
                        <input type="text" class="form-control" data-field="relatedCompany_${sectionNum}" placeholder="関連企業">
                    </div>
                    <div class="input-group">
                        <label>銀行</label>
                        <input type="text" class="form-control" data-field="bank_${sectionNum}" placeholder="銀行">
                    </div>
                    <div class="input-group">
                        <label>積載地</label>
                        <input type="text" class="form-control" data-field="loadingLocation_${sectionNum}" placeholder="積載地">
                    </div>
                    <div class="input-group">
                        <label>仕向地</label>
                        <input type="text" class="form-control" data-field="destination_${sectionNum}" placeholder="仕向地">
                    </div>
                </div>
                
                <div class="nested-question">
                    <div style="font-size: 12px; margin-bottom: 6px;">A. 以下に該当しない。※具体的な国名は参考資料シートを参照<br>・北朝鮮・イラン・ロシア・ベラルーシ<br>・外為法第16条第１項～３項に基づく許可の対象となる国、高リスク国（南アフリカ、フィリピン、ベトナム除く）、タックスヘイブン</div>
                    <div class="radio-group" style="margin-bottom: 8px;">
                        <div class="radio-item">
                            <input type="radio" name="locationCheckA_${sectionNum}" value="はい" data-field="locationCheckA_${sectionNum}" id="loc-a-yes-${sectionNum}">
                            <label for="loc-a-yes-${sectionNum}">はい</label>
                        </div>
                        <div class="radio-item">
                            <input type="radio" name="locationCheckA_${sectionNum}" value="いいえ" data-field="locationCheckA_${sectionNum}" id="loc-a-no-${sectionNum}">
                            <label for="loc-a-no-${sectionNum}">いいえ</label>
                        </div>
                    </div>
                    
                    <div style="font-size: 12px; margin-bottom: 6px;">B. 中国三省（遼寧省、吉林省、黒竜江省）に該当しない。</div>
                    <div class="radio-group" style="margin-bottom: 8px;">
                        <div class="radio-item">
                            <input type="radio" name="locationCheckB_${sectionNum}" value="はい" data-field="locationCheckB_${sectionNum}" id="loc-b-yes-${sectionNum}" onchange="updateLocationFields(${sectionNum})">
                            <label for="loc-b-yes-${sectionNum}">はい</label>
                        </div>
                        <div class="radio-item">
                            <input type="radio" name="locationCheckB_${sectionNum}" value="いいえ" data-field="locationCheckB_${sectionNum}" id="loc-b-no-${sectionNum}" onchange="updateLocationFields(${sectionNum})">
                            <label for="loc-b-no-${sectionNum}">いいえ</label>
                        </div>
                    </div>
                    
                    <div id="chinaQuestion_${sectionNum}" style="display: none; margin-left: 16px; margin-bottom: 8px;">
                        <div style="font-size: 12px; margin-bottom: 6px;">取引品目が北朝鮮特産品にあたらない（海産物、サルトリイバラの葉など）</div>
                        <div class="radio-group">
                            <div class="radio-item">
                                <input type="radio" name="notNKSpecialty_${sectionNum}" value="はい" data-field="notNKSpecialty_${sectionNum}" id="nk-specialty-yes-${sectionNum}">
                                <label for="nk-specialty-yes-${sectionNum}">はい</label>
                            </div>
                            <div class="radio-item">
                                <input type="radio" name="notNKSpecialty_${sectionNum}" value="いいえ" data-field="notNKSpecialty_${sectionNum}" id="nk-specialty-no-${sectionNum}">
                                <label for="nk-specialty-no-${sectionNum}">いいえ</label>
                            </div>
                        </div>
                    </div>
                    
                    <div style="font-size: 12px; margin-bottom: 6px;">C. 中東地域に該当しない。（アフガニスタン、アラブ首長国連邦、イエメン、イスラエル、イラク、イラン、オマーン、カタール、クウェート、サウジアラビア、シリア、トルコ、バーレーン、ヨルダン、レバノン）</div>
                    <div class="radio-group" style="margin-bottom: 8px;">
                        <div class="radio-item">
                            <input type="radio" name="locationCheckC_${sectionNum}" value="はい" data-field="locationCheckC_${sectionNum}" id="loc-c-yes-${sectionNum}" onchange="updateLocationFields(${sectionNum})">
                            <label for="loc-c-yes-${sectionNum}">はい</label>
                        </div>
                        <div class="radio-item">
                            <input type="radio" name="locationCheckC_${sectionNum}" value="いいえ" data-field="locationCheckC_${sectionNum}" id="loc-c-no-${sectionNum}" onchange="updateLocationFields(${sectionNum})">
                            <label for="loc-c-no-${sectionNum}">いいえ</label>
                        </div>
                    </div>
                    
                    <div id="middleEastQuestion_${sectionNum}" style="display: none; margin-left: 16px;">
                        <div style="font-size: 12px; margin-bottom: 6px;">取引品目が「中古車」ではない</div>
                        <div class="radio-group">
                            <div class="radio-item">
                                <input type="radio" name="notUsedCar_${sectionNum}" value="はい" data-field="notUsedCar_${sectionNum}" id="used-car-yes-${sectionNum}">
                                <label for="used-car-yes-${sectionNum}">はい</label>
                            </div>
                            <div class="radio-item">
                                <input type="radio" name="notUsedCar_${sectionNum}" value="いいえ" data-field="notUsedCar_${sectionNum}" id="used-car-no-${sectionNum}">
                                <label for="used-car-no-${sectionNum}">いいえ</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="remarks-section">
                
                <textarea class="remarks-textarea" data-field="transaction_q4_${sectionNum}_comment" placeholder="備考（画像ペースト可）" onpaste="handlePaste(event, 'transaction_q4_${sectionNum}_image')"></textarea>
                <div class="image-thumbnails" data-images="transaction_q4_${sectionNum}_image"></div>
                
            </div>
        </div>

        <div class="question-row" data-dynamic="transaction_q5_${sectionNum}">
            <div class="question-title">5. 取引先が取引不能業者にあたらない（公序良俗に反する商品・サービスの提供、ギャンブル・懸賞サイト、結婚紹介・出会い系サイト、ネットワークビジネス、送金代行・収納代行）</div>
            <div class="question-input">
                <div class="radio-group">
                    <div class="radio-item">
                        <input type="radio" name="partnerNotProhibited_${sectionNum}" value="はい" data-field="partnerNotProhibited_${sectionNum}" id="partner-ok-yes-${sectionNum}">
                        <label for="partner-ok-yes-${sectionNum}">はい</label>
                    </div>
                    <div class="radio-item">
                        <input type="radio" name="partnerNotProhibited_${sectionNum}" value="いいえ" data-field="partnerNotProhibited_${sectionNum}" id="partner-ok-no-${sectionNum}">
                        <label for="partner-ok-no-${sectionNum}">いいえ</label>
                    </div>
                </div>
                <div class="input-group" style="margin-top: 8px;">
                    <label>取引先事業内容</label>
                    <input type="text" class="form-control" data-field="partnerBusinessContent_${sectionNum}" placeholder="取引先事業内容">
                </div>
            </div>
            <div class="remarks-section">
                
                <textarea class="remarks-textarea" data-field="transaction_q5_${sectionNum}_comment" placeholder="備考（画像ペースト可）" onpaste="handlePaste(event, 'transaction_q5_${sectionNum}_image')"></textarea>
                <div class="image-thumbnails" data-images="transaction_q5_${sectionNum}_image"></div>
                
            </div>
        </div>

        <div class="question-row" data-dynamic="transaction_q6_${sectionNum}">
            <div class="question-title">6. ネット検索で、送金先または送金元の企業（個人）の風評に問題がない<br>検索ワード：法人名＋朝鮮、法人名＋迂回、法人名＋詐欺、法人名＋裁判</div>
            <div class="question-input">
                <div class="radio-group">
                    <div class="radio-item">
                        <input type="radio" name="noPartnerReputationRisk_${sectionNum}" value="はい" data-field="noPartnerReputationRisk_${sectionNum}" id="partner-rep-yes-${sectionNum}">
                        <label for="partner-rep-yes-${sectionNum}">はい</label>
                    </div>
                    <div class="radio-item">
                        <input type="radio" name="noPartnerReputationRisk_${sectionNum}" value="いいえ" data-field="noPartnerReputationRisk_${sectionNum}" id="partner-rep-no-${sectionNum}">
                        <label for="partner-rep-no-${sectionNum}">いいえ</label>
                    </div>
                </div>
            </div>
            <div class="remarks-section">
                
                <textarea class="remarks-textarea" data-field="transaction_q6_${sectionNum}_comment" placeholder="備考（画像ペースト可）" onpaste="handlePaste(event, 'transaction_q6_${sectionNum}_image')"></textarea>
                <div class="image-thumbnails" data-images="transaction_q6_${sectionNum}_image"></div>
                
            </div>
        </div>
    `;
}

// イベントバインド
function bindEvents() {
    document.querySelectorAll('[data-field]').forEach(element => {
        element.addEventListener('input', function() {
            formData[this.dataset.field] = this.value;
            updateLastUpdateDate();
        });
        
        element.addEventListener('change', function() {
            formData[this.dataset.field] = this.value;
            updateLastUpdateDate();
        });
    });
}

// 動的フィールド更新
function updateDynamicFields() {
    // 途上申込の変更内容質問
    const isOngoing = formData.applicationType === '途上申込';
    const changeContentQuestion = document.getElementById('changeContentQuestion');
    if (changeContentQuestion) {
        changeContentQuestion.style.display = isOngoing ? 'block' : 'none';
    }

    // 変更内容がいいえの場合の非活性化
    const isChangeContentNo = formData.changeContent === 'いいえ';
    
    // 申込情報の非活性化対象
    const applicantTargets = ['applicant_q3', 'applicant_q4', 'applicant_q5', 'applicant_q6', 'applicant_q7', 'applicant_q8', 'applicant_q9'];
    applicantTargets.forEach(target => {
        const element = document.querySelector(`[data-dynamic="${target}"]`);
        if (element) {
            if (isChangeContentNo) {
                element.classList.add('disabled');
            } else {
                element.classList.remove('disabled');
            }
        }
    });

    // 取引内容の非活性化対象
    for (let i = 1; i <= 5; i++) {
        const transactionTargets = [`transaction_q2_${i}`, `transaction_q3_${i}`, `transaction_q5_${i}`, `transaction_q6_${i}`];
        transactionTargets.forEach(target => {
            const element = document.querySelector(`[data-dynamic="${target}"]`);
            if (element) {
                if (isChangeContentNo) {
                    element.classList.add('disabled');
                } else {
                    element.classList.remove('disabled');
                }
            }
        });
    }

    // 税務申告・決算書の非活性化
    const taxSection = document.querySelector('[data-dynamic="tax-section"]');
    if (taxSection) {
        if (isChangeContentNo) {
            taxSection.classList.add('disabled');
        } else {
            taxSection.classList.remove('disabled');
        }
    }

    // 暗号資産関連
    const isCryptoNo = formData.notCryptoExchange === 'いいえ';
    const cryptoQuestions = document.getElementById('cryptoQuestions');
    if (cryptoQuestions) {
        cryptoQuestions.style.display = isCryptoNo ? 'block' : 'none';
    }

    // 規制業種関連
    const isRegulatedNo = formData.notRegulatedBusiness === 'いいえ';
    const licenseQuestions = document.getElementById('licenseQuestions');
    if (licenseQuestions) {
        licenseQuestions.style.display = isRegulatedNo ? 'block' : 'none';
    }
}

// 地域チェック関連の動的制御
function updateLocationFields(sectionNum) {
    const isChinaNo = formData[`locationCheckB_${sectionNum}`] === 'いいえ';
    const isMiddleEastNo = formData[`locationCheckC_${sectionNum}`] === 'いいえ';
    
    const chinaQuestion = document.getElementById(`chinaQuestion_${sectionNum}`);
    const middleEastQuestion = document.getElementById(`middleEastQuestion_${sectionNum}`);
    
    if (chinaQuestion) {
        chinaQuestion.style.display = isChinaNo ? 'block' : 'none';
    }
    
    if (middleEastQuestion) {
        middleEastQuestion.style.display = isMiddleEastNo ? 'block' : 'none';
    }
}

// 創業年数関連の動的制御
function updateBusinessAgeFields() {
    const isOver1Year = formData.businessAge === '1年以上';
    const isUnder1Year = formData.businessAge === '1年未満';
    
    const over1YearQuestions = document.getElementById('businessOver1YearQuestions');
    const under1YearQuestions = document.getElementById('businessUnder1YearQuestions');
    
    if (over1YearQuestions) {
        over1YearQuestions.style.display = isOver1Year ? 'block' : 'none';
    }
    
    if (under1YearQuestions) {
        under1YearQuestions.style.display = isUnder1Year ? 'block' : 'none';
    }
}

// 取引規模関連の動的制御
function updateTransactionScaleFields() {
    const scale = formData.transactionScale;
    
    const scaleAQuestions = document.getElementById('scaleAQuestions');
    const scaleBQuestions = document.getElementById('scaleBQuestions');
    const scaleCQuestions = document.getElementById('scaleCQuestions');
    
    if (scaleAQuestions) scaleAQuestions.style.display = scale === 'A' ? 'block' : 'none';
    if (scaleBQuestions) scaleBQuestions.style.display = scale === 'B' ? 'block' : 'none';
    if (scaleCQuestions) scaleCQuestions.style.display = scale === 'C' ? 'block' : 'none';
}

// アコーディオン
function toggleAccordion(header) {
    const accordion = header.parentElement;
    accordion.classList.toggle('open');
}

// 画像処理
function handlePaste(event, fieldName) {
    const items = event.clipboardData?.items;
    if (!items) return;
    
    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
            hasImage = true;
            const file = item.getAsFile();
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const base64Data = e.target.result;
                    if (!imageData[fieldName]) {
                        imageData[fieldName] = [];
                    }
                    imageData[fieldName].push(base64Data);
                    displayImages(fieldName);
                };
                reader.readAsDataURL(file);
            }
        }
    }
    
    if (hasImage) {
        event.preventDefault();
    }
}

function displayImages(fieldName) {
    const container = document.querySelector(`[data-images="${fieldName}"]`);
    if (!container) return;

    container.innerHTML = ''; // ← ここで常に表示をクリア

    if (!imageData[fieldName]) return;

    imageData[fieldName].forEach((imageSrc, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'image-thumbnail';
        thumbnail.innerHTML = `
            <img src="${imageSrc}" alt="画像 ${index + 1}" onclick="showModal('${imageSrc}')">
            <button class="image-remove" onclick="removeImage('${fieldName}', ${index})">×</button>
        `;
        container.appendChild(thumbnail);
    });
}

function removeImage(fieldName, imageIndex) {
    if (imageData[fieldName]) {
        imageData[fieldName].splice(imageIndex, 1);
        if (imageData[fieldName].length === 0) {
            delete imageData[fieldName];
        }
        displayImages(fieldName);
    }
}

function showModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    modalImage.src = imageSrc;
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.classList.remove('show');
}

// JSON保存・読み込み
function saveToJSON() {
    const allData = {
        formData: formData,
        imageData: imageData,
        timestamp: new Date().toISOString()
    };
    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `checksheet_${new Date().getTime()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

//編集モード切替用関数
function setAllFieldsDisabled(disabled) {
  document.querySelectorAll('input, textarea, select, button[data-disable-target]').forEach(el => {
    // 編集ボタンやJSON保存/読み込みボタンは除外
    if (el.id === 'editButton' || el.type === 'file' || el.classList.contains('btn')) return;
    el.disabled = disabled;
  });
}

//編集ボタンの動作
function enableEditMode() {
  setAllFieldsDisabled(false);
  document.getElementById('editButton').style.display = 'none';
}

function loadFromJSON(event) {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data.formData) {
                    formData = data.formData;
                    imageData = data.imageData || {};
                    
                    // フォームデータを復元
                    Object.keys(formData).forEach(key => {
                    const elements = document.querySelectorAll(`[data-field="${key}"]`);
                    if (elements.length > 0 && elements[0].type === 'radio') {
                        elements.forEach(el => {
                        el.checked = el.value === formData[key];
                        });
                    } else if (elements.length > 0) {
                        elements[0].value = formData[key];
                    }
                    });

                    
                    // 画像データを復元
                    Object.keys(imageData).forEach(fieldName => {
                        displayImages(fieldName);
                    });
                    
                    // 動的フィールドを更新
                    updateDynamicFields();
                    updateBusinessAgeFields();
                    updateTransactionScaleFields();
                    
                    // 地域フィールドを更新
                    for (let i = 1; i <= 5; i++) {
                        updateLocationFields(i);
                    }
                    
                    bindEvents();
                }
            } catch (error) {
                alert('JSONファイルの読み込みに失敗しました。');
            }
        };
        reader.readAsText(file);
    }
    // ...既存の復元処理の後
    setAllFieldsDisabled(true);
    document.getElementById('editButton').style.display = 'inline-block';
}
