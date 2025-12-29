// グローバル変数
let formData = {};
let imageData = {};
let eventsBound = false;

// === 状態定義とUI制御ユーティリティ ===
const STATUS = { INITIAL: 'initial', LOADED: 'loaded', EDITING: 'editing' };
let appStatus = STATUS.INITIAL; // 初期表示（編集不可）
let isReadOnly = false;

function getButtons() {
  return {
    finalize: document.getElementById('finalize'),   // チェックシート確定（静的HTML）
    tempSave: document.getElementById('tempSave'),   // 一時保存（JSON）
    loadFile: document.getElementById('loadFile'),   // ファイル読込（可視ボタン）
    loadInput: document.getElementById('loadInput'), // ファイル選択 input[type=file]
    edit: document.getElementById('editButton'),     // 編集
  };
}

function setButtonEnabled(el, enabled) {
  if (!el) return;
  el.disabled = !enabled;
}

function updateButtonsForStatus() {
  const btn = getButtons();
  // 表に基づく活性／非活性
  switch (appStatus) {
    case STATUS.INITIAL:
      setButtonEnabled(btn.finalize, false);   // ×
      setButtonEnabled(btn.tempSave, false);   // ×
      setButtonEnabled(btn.loadFile, true);    // 〇
      setButtonEnabled(btn.edit, true);        // 〇
      break;
    case STATUS.LOADED:
      setButtonEnabled(btn.finalize, false);   // ×
      setButtonEnabled(btn.tempSave, false);   // ×
      setButtonEnabled(btn.loadFile, false);   // ×
      setButtonEnabled(btn.edit, true);        // 〇
      break;
    case STATUS.EDITING:
      setButtonEnabled(btn.finalize, true);    // 〇
      setButtonEnabled(btn.tempSave, true);    // 〇
      setButtonEnabled(btn.loadFile, false);   // ×
      setButtonEnabled(btn.edit, false);       // ×
      break;
  }
}

// 状態を切り替え、isReadOnly・入力欄・ボタン状態を同期
function setStatus(next) {
  appStatus = next;
  isReadOnly = (next !== STATUS.EDITING); // isReadOnly の同期
  setAllFieldsDisabled(isReadOnly);       // 入力欄の活性／非活性
  updateTransactionHeaderHighlight()      // 取引内容の強調／非活性
  updateButtonsForStatus();               // ボタンの活性／非活性
}

// 初期化
document.addEventListener('DOMContentLoaded', function () {
    updateLastUpdateDate();
    updateDynamicFields();
    updateRemitSourceFields();
    updateTransactionScaleFields();

    // 初期状態：初期表示（編集不可）
    setStatus(STATUS.INITIAL);

    // ボタンのイベントバインド（活性・非活性は setStatus が管理）
    const btn = getButtons();
    if (btn.tempSave)      btn.tempSave.addEventListener('click', saveToJSON);
    if (btn.finalize)      btn.finalize.addEventListener('click', saveToStaticHTML);    
    if (btn.loadFile){
      btn.loadFile.addEventListener('click', () => {
        if (btn.loadInput){
          btn.loadInput.value = ''; //空にする
          btn.loadInput.click();
        }
      })
    };
    if (btn.loadInput)     btn.loadInput.addEventListener('change', loadFromJSON);
    if (btn.edit)          btn.edit.addEventListener('click', enableEditMode);

    // 入力イベント委譲
    bindEvents();
});

// 最終更新日時を更新
function updateLastUpdateDate() {
    const now = new Date();
    const formatted = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    formData.lastUpdateDate = formatted;
    const field = document.querySelector('[data-field="lastUpdateDate"]');
    if (field) field.value = formatted;
}

function applyFormDataToDOM() {
  document.querySelectorAll('[data-field]').forEach(el => {
    const key = el.dataset.field;
    if (!(key in formData)) return;

    if (el.type === 'radio') {
      el.checked = (el.value === formData[key]);
    } else if (el.tagName.toLowerCase() === 'select') {
      el.value = formData[key];
    } else {
      el.value = formData[key];
    }

    // 疎明資料金額（万円）はカンマ付与（evidenceAmount_${index} に対応）
    if (key.startsWith('evidenceAmount')) {
      formatEvidenceAmount(el);
    }
  });
}

// 疎明資料金額（万円）をカンマ区切りにする
function formatEvidenceAmount(element) {
    if (element.value) {
        let raw = element.value.replace(/,/g, '').replace(/[^\d]/g, '');
        if (raw) {
            element.value = Number(raw).toLocaleString();
            formData[element.dataset.field] = raw;
        } else {
            element.value = '';
            formData[element.dataset.field] = '';
        }
    }
}

// イベントバインド

function bindEvents() {
  if (eventsBound) return;
  eventsBound = true;

  document.addEventListener('input', function (e) {
    const el = e.target;
    const field = el?.dataset?.field;
    if (!field) return;

    formData[field] = el.value;
    updateLastUpdateDate();

    // 疎明資料金額（万円）のフォーマット
    if (field.startsWith('evidenceAmount')) {
      formatEvidenceAmount(el);
    }
  });

  document.addEventListener('change', function (e) {
    const el = e.target;
    const field = el?.dataset?.field;
    if (!field) return;

    formData[field] = el.value;
    updateLastUpdateDate();

    // 取引件数変更 → 再生成
    if (field === 'transactionCount') {
      updateTransactionHeaderHighlight();
      return;
    }

    // 末尾 _N からセクション番号を推定
    const m = field.match(/_(\d+)$/);
    if (m) {
      const idx = Number(m[1]);
      if (field.startsWith('managementSheetFilled_')) updateSubmissionDateFields(idx);
      if (field.startsWith('locationCheckB_') || field.startsWith('locationCheckC_')) updateLocationFields(idx);
      if (field.startsWith('declaredAmountCountChange_')) updateChangeNotice(idx);
    }
    updateRemitSourceFields();
    if (field === 'transactionScale') updateTransactionScaleFields();
  });
}

// 動的フィールド更新
function updateDynamicFields() {
    // 途上申込の変更内容質問
    const isOngoing = formData.applicationType === '途上申込';
    const changeContentQuestion = document.getElementById('changeContentQuestion');
    if (changeContentQuestion) {
        changeContentQuestion.style.display = isOngoing ? 'block': 'none';
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

// 提出可能日の動的制御
function updateSubmissionDateFields(sectionNum) {
    const managementSheetValue = formData[`managementSheetFilled_${sectionNum}`] === 'はい';
    const submissionDateInputDiv = document.getElementById(`submissionDateInput_${sectionNum}`);
    
    if (submissionDateInputDiv) {
        submissionDateInputDiv.style.display = managementSheetValue ? 'block' : 'none';
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

// 申告の取引額・件数変更時の動的制御
function updateChangeNotice(sectionNum) {
    const declaredChangeNo = formData[`declaredAmountCountChange_${sectionNum}`] === 'いいえ';
    const changeNotice = document.getElementById(`changeNotice_${sectionNum}`);
    
    if (changeNotice) {
        changeNotice.style.display = declaredChangeNo ? 'block' : 'none';
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

// 送金原資の動的制御
function updateRemitSourceFields() {
  const count = Number(formData.transactionCount ?? 1);
  let hasRemit = false;
  for (let i = 1; i <= count; i++) {
    if (formData[`transactionType_${i}`] === '外貨送金') {
      hasRemit = true;
      break;
    }
  }
  const remittanceSourceDiv = document.getElementById('remittanceSourceQuestion');
  if (remittanceSourceDiv) {
    if (hasRemit) remittanceSourceDiv.classList.remove('disabled');
    else remittanceSourceDiv.classList.add('disabled');
  }
}

// セクション生成時の初期化(活性/非活性)を集約
function initSection(index) {
  updateSubmissionDateFields(index);
  updateLocationFields(index);
  updateChangeNotice(index);  
  updateTransactionScaleFields();
  updateRemitSourceFields();
}

// 任意のルート要素配下の「すべての属性値」に含まれる ${index} を実値に置換
function replaceAllIndexPlaceholders(root, index) {
  root.querySelectorAll('*').forEach(el => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.value && attr.value.includes('${index}')) {
        attr.value = attr.value.replace(/\$\{index\}/g, index);
      }
    }
  });
}

function buildTransactionContent(index) {
  const tpl = document.getElementById('transaction-template');
  if (!tpl) {
    console.warn('transaction-template が見つかりません');
    return null;
  }
  const frag = tpl.content.cloneNode(true);

  // ${index} を実インデックスに置換
  frag.querySelectorAll('[id],[name],[data-field],label[for],[data-section]').forEach(el => {
    if (el.id)           el.id           = el.id.replace(/\$\{index\}/g, index);
    if (el.name)         el.name         = el.name.replace(/\$\{index\}/g, index);
    if (el.dataset && el.dataset.field) {
      el.dataset.field = el.dataset.field.replace(/\$\{index\}/g, index);
    }
    if (el.tagName === 'LABEL' && el.htmlFor) {
      el.htmlFor = el.htmlFor.replace(/\$\{index\}/g, index);
    }
    // テンプレート内の data-section を持つ場合も置換しておく（保険）
    if (el.dataset && el.dataset.section) {
      el.dataset.section = el.dataset.section.replace(/\$\{index\}/g, index);
    }
  });

  // 全属性値の一括置換（data-images / onpaste / data-paste-key などを包括）
  replaceAllIndexPlaceholders(frag, index);

  // テンプレート内の .accordion-content を取り出す
  const templateContent = frag.querySelector('.accordion-content');
  if (!templateContent) {
    console.warn('テンプレート内に .accordion-content が見つかりません');
    return null;
  }

  // content の中身（子要素群）を DocumentFragment で返す
  const contentFragment = document.createDocumentFragment();
  Array.from(templateContent.childNodes).forEach(node => {
    contentFragment.appendChild(node);
  });
  return contentFragment;
}

// アコーディオン・生成
function toggleAccordion(header) {
  // 非活性の場合は処理しない
  if (header.classList.contains('disabled')) return;

  const accordion = header.parentElement;
  const index = Number(header.dataset.index ?? accordion.dataset.section);

  if (accordion.classList.contains('open')) {
    accordion.classList.remove('open');   // 閉じる（open クラスを削除）
  }
  else {
    ensureSectionContentGenerated(index); // 1) 中身生成（既に生成済みなら何もしない）
    accordion.classList.add('open');      // 2) 開く（open クラスを付与）
  }
}

// 取引内容のアコーディオン制御
function updateTransactionHeaderHighlight() {
  const count = Number(formData.transactionCount ?? 1);
  document.querySelectorAll('#transactionSections .accordion-header').forEach((header, idx) => {
    header.classList.toggle('strong', idx < count);         // 強調：必要件数だけ見た目をハイライト
    header.classList.toggle('disabled', (idx + 1) > count); // 無効：transactionCount超は非活性化
    if ((idx + 1) > count) {
      header.title = '取引内容の数を確認ください';
      // 既に開いていたら閉じる（UI整合性のため）
      const acc = header.parentElement;
      if (acc?.classList.contains('open')) acc.classList.remove('open');
    } else {
      header.removeAttribute('title');
    }
  });
}

// === スクリーンショット縮小設定（固定） ===
const SCREENSHOT_MIME = 'image/png'; // ロスレスで文字のにじみを抑える

function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

function ensureCanvas(img) {
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return c;
}

// 1/2縮小（にじみ抑制のための段階縮小を継続）
function halfDown(canvasOrImg) {
  const srcW = canvasOrImg.width, srcH = canvasOrImg.height;
  const dstW = Math.max(1, Math.floor(srcW / 2));
  const dstH = Math.max(1, Math.floor(srcH / 2));
  const tmp = document.createElement('canvas');
  tmp.width = dstW; tmp.height = dstH;
  const ctx = tmp.getContext('2d');
  ctx.imageSmoothingEnabled = true;     // true: 滑らか重視
  ctx.imageSmoothingQuality = 'medium'; // high, medium, low
  ctx.drawImage(canvasOrImg, 0, 0, dstW, dstH);
  return tmp;
}

// 単一しきい値：width が NO_SHRINK_THRESHOLD を超える限り 1/2
const NO_SHRINK_THRESHOLD = 1280;

async function compressScreenshotBlob(blob) {
  const img = await blobToImage(blob);
  let canvas = ensureCanvas(img);

  // 最大辺がしきい値より大きければ 1/2 を繰り返す
  while (canvas.width > NO_SHRINK_THRESHOLD) {
    canvas = halfDown(canvas);
  }

  return canvas.toDataURL(SCREENSHOT_MIME);
}

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
        compressScreenshotBlob(file)
          .then((dataUrl) => {
            if (!imageData[fieldName]) imageData[fieldName] = [];
            imageData[fieldName].push(dataUrl);
            displayImages(fieldName);
          })
          .catch((err) => console.error('[handlePaste] compress error:', err));
      }
    }
  }
  if (hasImage) event.preventDefault();
}

function ensureSectionContentGenerated(index) {
  const accordion = document.querySelector(`.accordion[data-section="${index}"]`);
  if (!accordion) return;
  const content = accordion.querySelector('.accordion-content');
  if (content.dataset.generated) return;

  const fragment = buildTransactionContent(index);
  if (fragment) {
    content.innerHTML = '';
    content.appendChild(fragment);
    content.dataset.generated = 'true';

    initSection(index)// 生成直後に初期化(toggleAccordion と同等)
    applyFormDataToDOM(); // JSONの値をDOMへ反映

    if (isReadOnly) {
      setAllFieldsDisabled(true);// 閲覧専用中なら、非活性化を再適用
    }
  }
}

function displayImages(fieldName) {
    const container = document.querySelector(`[data-images="${fieldName}"]`);
    if(!container){
      console.warn('[displayImages] コンテナ未生成:', fieldName); return;
    }
    container.innerHTML = ''; // ← ここで常に表示をクリア
    if (!imageData[fieldName]) return;

    imageData[fieldName].forEach((imageSrc, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'image-thumbnail';
        thumbnail.innerHTML = `
            <img src="${imageSrc}" alt="画像 ${index + 1}" onclick="showModal('${imageSrc}')">
            <button type="button" class="image-remove" onclick="removeImage('${fieldName}', ${index})">×</button>
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

// 必須項目バリデーション
function validateRequiredFields() {
  let isValid = true;
  let firstError = null;

  // 既存のエラー表示をクリア
  document.querySelectorAll('.error, .field-error').forEach(el => el.classList.remove('error', 'field-error'));

  // 必須チェック対象（備考は除外）
  const fields = Array.from(document.querySelectorAll('[data-field]'))
    .filter(el => !(el.getAttribute('data-field') || '').endsWith('_comment'));

  for (const el of fields) {
    // 非活性・非表示はスキップ
    if (el.closest('.disabled')) continue;
    if (el.offsetParent === null) continue;

    // アコーディオンで閉じている場合はスキップ
    const accordion = el.closest('.accordion');
    if (accordion && !accordion.classList.contains('open')) continue;

    const questionRow = el.closest('.question-row');

    if (el.type === 'radio') {
      // 同名グループを重複チェックしないため、グループの先頭要素のみ処理
      const firstOfGroup = document.querySelector(`input[name="${el.name}"]`);
      if (firstOfGroup !== el) continue;

      const checked = document.querySelector(`input[name="${el.name}"]:checked`);
      if (!checked) {
        isValid = false;
        if (!firstError) firstError = el;
        if (questionRow) questionRow.classList.add('error');
        else el.classList.add('field-error');
      }
    } else {
      // テキスト系・select の空チェック
      const val = (el.value || '').toString().trim();
      if (val === '') {
        isValid = false;
        if (!firstError) firstError = el;
        if (questionRow) questionRow.classList.add('error');
        else el.classList.add('field-error');
      }
    }
  }

  if (!isValid) {
    if (firstError) firstError.focus();
  }

  return isValid;
}

// 保存時に取引内容セクションを自動オープン
function openTransactionSectionsForSave() {
  const count = Number(formData.transactionCount ?? 1);
  document.querySelectorAll('#transactionSections .accordion-header')
    .forEach(header => {
      const acc = header.parentElement;
      const sec = Number(acc.dataset.section);
      if (sec <= count && !acc.classList.contains('open') && !header.classList.contains('disabled')) {
        toggleAccordion(header);  // 生成→open付与（必ず開く）
      }
    });
}

// JSON保存・読み込み
function saveToJSON() {
    // 取引内容セクションの自動オープン
    openTransactionSectionsForSave()

    // バリデーション実行（関数が存在する場合）
    let isValid = true;
    if (typeof validateRequiredFields === "function") {
        isValid = validateRequiredFields();
    }

    // バリデーションNGでも保存を許可するか確認
    if (!isValid) {
        const proceed = confirm('未入力の必須項目があります。エラーを無視して保存しますか？');
        if (!proceed) {
            return; // 保存中止
        }
    }
    
    const allData = {
        formData: formData,
        imageData: imageData,
        timestamp: new Date().toISOString()
    };
    const dataStr = JSON.stringify(allData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    let receptionDate = formData.receptionDate || 'noDate';
    receptionDate = receptionDate.replace(/-/g, '');
    let companyName = formData.companyName || 'noName';

    const exportFileDefaultName = `${receptionDate}_${companyName}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function getBaseCSS() {
  return `
    @charset "UTF-8";
    :root {
        --primary: #030213;
        --primary-foreground: #ffffff;
        --secondary: #f3f3f5;
        --muted: #ececf0;
        --muted-foreground: #717182;
        --border: rgba(0, 0, 0, 0.1);
        --destructive: #d4183d;
        --destructive-foreground: #ffffff;
        --radius: 6px;
    }

    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        line-height: 1.4;
        color: #030213;
        background: #ffffff;
        font-size: 13px;
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 16px;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding: 12px 0;
        border-bottom: 1px solid var(--border);
    }

    .header h1 {
        font-size: 20px;
        font-weight: 500;
    }

    .button-group {
        display: flex;
        gap: 8px;
    }

    .btn {
        padding: 6px 12px;
        border: 1px solid var(--border);
        background: white;
        border-radius: var(--radius);
        cursor: pointer;
        font-size: 13px;
        transition: background-color 0.2s;
    }

    .btn:hover {
        background: var(--secondary);
    }

    #editButton {
      display: inline-block;
    }

    .section {
        margin-bottom: 16px;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        background: white;
    }

    .section-header {
        padding: 12px 16px;
        background: var(--secondary);
        border-bottom: 1px solid var(--border);
        font-weight: 500;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .section-content {
        padding: 12px;
    }

    .question-row {
        display: grid;
        grid-template-columns: 1fr 1fr 300px;
        gap: 12px;
        align-items: start;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
    }

    .question-row:last-child {
        border-bottom: none;
    }

    .question-row.disabled {
        opacity: 1.0;
        pointer-events: none;
        background: #d6d6d6;
    }

    .question-title {
        font-size: 13px;
        line-height: 1.3;
    }

    .question-input {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .form-control {
        padding: 6px 8px;
        border: 1px solid var(--border);
        border-radius: 4px;
        font-size: 13px;
        background: var(--secondary);
    }

    .form-control:focus {
        outline: none;
        border-color: var(--primary);
    }

    .radio-group {
        display: flex;
        gap: 12px;
        align-items: center;
    }

    .radio-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
    }

    .nested-question {
        margin-left: 12px;         
        margin-top: 4px;           
        padding: 6px 6px;            
        background: var(--muted);
        border-radius: 4px;
        border-left: 3px solid var(--primary);
    }

    .nested-question .question-row {
        padding: 6px 6px;            
        gap: 12px;
    }

    .nested-question .question-title {
        font-size: 12px;
    }

    .remarks-section {
        margin-top: 0px;
    }

    .remarks-textarea {
        width: 100%;
        min-height: 30px;
        padding: 4px 4px;
        border: 1px solid var(--primary);
        border-radius: 4px;
        font-size: 12px;
        resize: vertical;
        background: white;
    }

    .image-thumbnails {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 6px;
    }

    .image-thumbnail {
        position: relative;
        width: 60px;
        height: 60px;
        border: 1px solid var(--border);
        border-radius: 4px;
        overflow: hidden;
    }

    .image-thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        cursor: pointer;
    }

    .image-remove {
      position: absolute;
      top: 4px;         
      right: 4px;
      width: 24px;      
      height: 24px;
      font-size: 10px;  
      line-height: 1;
      background: var(--destructive);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: none;    
      align-items: center;
      justify-content: center;
      z-index: 2;       
    }

    .image-remove.disabled {
      opacity: 1.0;
      pointer-events: none;
    }

    .image-thumbnail:hover .image-remove {
        display: flex;
    }

    .image-hint {
        font-size: 11px;
        color: var(--muted-foreground);
        margin-top: 4px;
    }

    /* アコーディオン */
    .accordion {
        border: 1px solid var(--border);
        border-radius: var(--radius);
        margin-bottom: 8px;
    }

    .accordion-header {
        padding: 10px 16px;
        background: var(--secondary);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border);
    }

    .accordion-header:hover {
        background: var(--muted);
    }

    .accordion-header.strong {
      font-weight: bold;
      color: #009fae;         /* シアン */
      background: #e6faff;    /* 薄いシアン背景 */
    }

    .accordion-header.disabled {
      opacity: 0.5;               /* グレーアウト */
      cursor: not-allowed;        /* マウスカーソルを「不可」に */
    }

    .accordion-content {
        display: none;
        padding: 12px;
    }

    .accordion.open .accordion-content {
        display: block;
    }

    .accordion-toggle {
        transition: transform 0.2s;
    }

    .accordion.open .accordion-toggle {
        transform: rotate(180deg);
    }

    /* モーダル */
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal.show {
        display: flex;
    }

    .modal-content {
      width: 90vw;
      max-height: 90vh;       /* ここは上限だけにして、縦スクロール許可 */
      background: white;
      border-radius: var(--radius);
      padding: 0;             /* 幅いっぱいにしたいので余白は0推奨（任意） */
      overflow-y: auto;       /* 縦方向にスクロール可 */
      display: block;         /* Flex不要ならblockのままでOK */
    }

    .modal-image {
      display: block;
      width: 100%;            /* 横幅フル */
      height: auto;           /* 縦は比率維持で自動 */
      object-fit: contain;    /* 任意（width:100%なので効きは限定的） */
      image-rendering: auto;
    }

    /* グリッドレイアウト用 */
    .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
    }

    .grid-3 {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 8px;
    }

    .hidden {
        display: none;
    }

    /* 縦配置のinput群 */
    .input-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .input-group label {
        font-size: 12px;
        color: var(--muted-foreground);
    }

    /* 非活性化されている選択済みラジオボタンをくすんだ青色で表示 */
    input[type="radio"]:disabled:checked + label {
      background: #bcd7fa;      /* くすんだ青色 */
      color: #205080;           /* 文字もやや青系で */
      border-radius: 4px;
      font-weight: bold;
      opacity: 1;
      /* 必要に応じてpadding追加 */
      padding: 2px 8px;
    }

    /* エラー表示：行単位（question-row）に .error が付いている場合はタイトルを強調 */
    .question-row.error .question-title {
      color: var(--destructive);
      font-weight: 700;
      background: rgba(212,24,61,0.06);
      padding: 4px 6px;
      border-radius: 4px;
    }

    /* 個別要素に付くエラー（まれなケース） */
    .field-error {
      border: 2px solid #d4183d;
      background: #fff0f0;
    }

    /* 備考欄はエラー時でも元の見た目を維持 */
    .question-row.error .remarks-section .remarks-textarea,
    .field-error[type="textarea"] {
      border: 1px solid var(--border);
      background: white;
    }
  `;
}

// === HTMLに出力 ===
/**
 * 重複している data:image の <img> を 1 つの画像マップに集約し、
 * 各所の <img> は data-img-id 参照に置換。末尾に JSON + IIFE ローダーを 1 回だけ埋め込む。
 * 返り値は「最終的に保存する HTML 文字列」。
 */
function dedupeInlineImagesWithImg(htmlString) {
  // 文字列 → DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // data:image を持つ <img> を収集
  const imgs = Array.from(doc.querySelectorAll('img[src^="data:image"]'));

  // Base64 → ID のマップ／出力用画像マップ
  const b64ToId = new Map();          // key: base64本体, value: 'img_1' 等
  const imageMap = {};                // { img_1: { mime, b64 }, ... }
  let counter = 0;

  const parseDataUrl = (url) => {
    // 例: data:image/webp;base64,AAA...
    const m = url.match(/^data:([^;]+);base64,(.+)$/);
    return m ? { mime: m[1], b64: m[2] } : null;
  };

  // 画像の重複を集約
  for (const img of imgs) {
    const src = img.getAttribute('src');
    const info = parseDataUrl(src || '');
    if (!info) continue;

    let id = b64ToId.get(info.b64);
    if (!id) {
      id = `img_${++counter}`;
      b64ToId.set(info.b64, id);
      imageMap[id] = { mime: info.mime, b64: info.b64 };
    }

    // <img> は src を外して ID 参照に（alt/class 等は維持）
    img.removeAttribute('src');
    img.setAttribute('data-img-id', id);
  }

  // 1枚でも見つかった場合のみ、画像マップとローダーを挿入
  if (counter > 0) {
    // a) 画像マップ（JSON）
    const scriptMap = doc.createElement('script');
    scriptMap.type = 'application/json';
    scriptMap.id = '__EMBEDDED_IMAGE_MAP__';
    scriptMap.textContent = JSON.stringify(imageMap);

    // b) ローダー（IIFE：読み込み時に data-img-id → src=data:... を復元）
    const loader = doc.createElement('script');
    loader.textContent = `
      (function(){
        var el = document.getElementById('__EMBEDDED_IMAGE_MAP__');
        if(!el) return;
        var map = {};
        try { map = JSON.parse(el.textContent); } catch(e){}
        var list = document.querySelectorAll('img[data-img-id]');
        list.forEach(function(img){
          var id = img.getAttribute('data-img-id');
          var ent = map[id];
          if (ent && !img.getAttribute('src')) {
            img.setAttribute('src', 'data:' + ent.mime + ';base64,' + ent.b64);
          }
        });
      })();
    `;

    // 本文末尾に 1 回だけ埋め込む
    doc.body.appendChild(scriptMap);
    doc.body.appendChild(loader);
  }

  // 再シリアライズ（DOCTYPE を付け直す）
  return '<!doctype html>\n' + doc.documentElement.outerHTML;
}

// 静的HTML保存
function saveToStaticHTML() {
    // 取引内容セクションの自動オープン
    openTransactionSectionsForSave()

    const clone = document.documentElement.cloneNode(true);

    // インタラクティブ要素、埋め込み要素、テンプレートなど不要な要素を削除
    clone.querySelectorAll('script, style, button, .btn, template').forEach(el => el.remove());

    // フォーム要素を静的なテキストに置き換える
    clone.querySelectorAll('input, textarea, select').forEach(el => {

    if (el.type === 'radio') {
        if (el.checked) {
            // checked の radio のみ表示
            // labelのテキストも取得
            const label = clone.querySelector(`label[for="${el.id}"]`);
            const span = document.createElement('span');
            if (label) {
                span.textContent = label.textContent;
                label.remove(); // labelはspanに置き換えるので削除
            } else {
                
            }
            el.replaceWith(span);
        } else {
            // 未選択の radio と label は削除
            const label = clone.querySelector(`label[for="${el.id}"]`);
            el.remove();
            if (label) label.remove();
        }
    } else if (el.type === 'checkbox') {
        const span = document.createElement('span');
        span.textContent = el.checked ? '✔' : '✘';
        el.replaceWith(span);
    } else if (el.tagName.toLowerCase() === 'select') {
    let displayText = '';
        if (el.dataset.field && formData[el.dataset.field]) {
            // formDataに値がある場合はそれを優先
            displayText = formData[el.dataset.field];
        } else {
            const selectedOption = el.options[el.selectedIndex];
            displayText = selectedOption ? selectedOption.text : '';
        }
        const span = document.createElement('span');
        span.textContent = displayText;
        el.replaceWith(span);
    } else {
        const span = document.createElement('span');
        span.textContent = el.value;
        el.replaceWith(span);
    }
    });

    // サムネイルに残った inline onclick（Base64文字列を含む）を除去
    clone.querySelectorAll('.image-thumbnail img[onclick]').forEach(img => img.removeAttribute('onclick'));

    // <head>に<style>タグでCSSを埋め込む
    const head = clone.querySelector('head');
    if (head) {
        const styleTag = document.createElement('style');
        styleTag.textContent = getBaseCSS();
        head.appendChild(styleTag);
    }

    // インラインJSをbody末尾に追加
    const inlineScript = document.createElement('script');
    inlineScript.textContent = `
      function showModal(imageSrc) {
        document.getElementById('modalImage').src=imageSrc;
        document.getElementById('imageModal').classList.add('show');
      }
      function closeModal() {
        document.getElementById('imageModal').classList.remove('show');
      }
      function toggleAccordion(header) {
        if (header.classList.contains('disabled')) return;
        header.parentElement.classList.toggle('open');
      }
      document.addEventListener('DOMContentLoaded',function(){
        document.querySelectorAll('.image-thumbnail img').forEach(img=>{
            img.onclick=function(){showModal(this.src);};
        });
        document.querySelectorAll('.accordion-header').forEach(header=>{
            header.onclick=function(){toggleAccordion(this);};
        });
      });
    `;
    clone.querySelector('body').appendChild(inlineScript);

    // 保存用HTMLを生成
    let receptionDate = formData.receptionDate || 'noDate';
    receptionDate = receptionDate.replace(/-/g, '');
    let companyName = formData.companyName || 'noName';

    const html = '<!DOCTYPE html>\n' + clone.outerHTML;
    const finalHtml = dedupeInlineImagesWithImg(html); // 画像(base64形式)の重複排除
    const blob = new Blob([finalHtml], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${receptionDate}_${companyName}.html`;
    a.click();

    // JSONでも保存
    saveToJSON()
}

//編集モード切替用関数setAll
function setAllFieldsDisabled(disabled) {
  document.querySelectorAll('input, textarea, select, button[data-disable-target]').forEach(el => {
    // 編集ボタンやJSON保存/読み込みボタンは除外
    if (el.id === 'editButton' || el.type === 'file' || el.classList.contains('btn')) return;
    el.disabled = disabled;
  });
  
  // 画像削除ボタンも対象にする
  document.querySelectorAll('.image-remove').forEach(btn => {
    if (disabled) {
        btn.classList.add('disabled');
        btn.setAttribute('disabled', 'disabled'); // ← 追加
    } else {
        btn.classList.remove('disabled');
        btn.removeAttribute('disabled'); // ← 追加
    }
  });
}

//編集ボタンの動作
function enableEditMode() {
  setStatus(STATUS.EDITING);
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
                    const count = Number(formData.transactionCount ?? 1);
                    
                    // 取引内容の中身を事前生成（件数に合わせて）
                    for (let i = 1; i <= count; i++) {
                      ensureSectionContentGenerated(i);
                    }

                    // フォームデータを復元
                    applyFormDataToDOM();

                    // 画像データを復元
                    Object.keys(imageData).forEach(fieldName => {
                      displayImages(fieldName);
                    });

                    // 動的フィールドを更新
                    updateDynamicFields();
                    updateBusinessAgeFields();
                    updateTransactionScaleFields();
                    updateRemitSourceFields();
                    for (let i = 1; i <= count; i++) {
                        updateSubmissionDateFields(i);
                        updateLocationFields(i);
                    }

                    // 状態：ファイル読込後（編集不可）
                    setStatus(STATUS.LOADED);
                }
            } catch (error) {
                alert('JSONファイルの読み込みに失敗しました。');
            }
        };
        reader.readAsText(file);
    }
}
