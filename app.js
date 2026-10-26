const MEMORY_TOTAL_KB = 64;

const typePalette = {
  Código: '#8b5cf6',
  Datos: '#34d399',
  Pila: '#fbbf24',
  'Tabla de Símbolos': '#38bdf8',
};

let segments = [
  { id: 1, name: 'main', type: 'Código', size: 12, base: 0, permissions: 'R-X', color: typePalette['Código'] },
  { id: 2, name: 'datos_global', type: 'Datos', size: 10, base: 12, permissions: 'RW-', color: typePalette['Datos'] },
  { id: 3, name: 'pila', type: 'Pila', size: 8, base: 22, permissions: 'RW-', color: typePalette['Pila'] },
  { id: 4, name: 'tabla_sim', type: 'Tabla de Símbolos', size: 9, base: 30, permissions: 'R--', color: typePalette['Tabla de Símbolos'] },
];

const memoryCanvas = document.getElementById('memoryCanvas');
const segmentList = document.getElementById('segmentList');
const segmentTableBody = document.getElementById('segmentTableBody');
const deleteSegmentSelect = document.getElementById('deleteSegmentSelect');
const segmentNumberSelect = document.getElementById('segmentNumber');
const translationResult = document.getElementById('translationResult');
const guideModal = document.getElementById('guideModal');

function sortSegments() {
  segments = [...segments].sort((a, b) => a.base - b.base);
}

function getNextSegmentId() {
  return segments.reduce((max, segment) => Math.max(max, segment.id), 0) + 1;
}

function findFirstAvailableHole(size) {
  const sorted = [...segments].sort((a, b) => a.base - b.base);
  let nextBase = 0;

  for (const segment of sorted) {
    const gapSize = segment.base - nextBase;
    if (gapSize >= size) {
      return nextBase;
    }
    nextBase = segment.base + segment.size;
  }

  if (nextBase + size <= MEMORY_TOTAL_KB) {
    return nextBase;
  }

  return null;
}

function updateStatistics() {
  const used = segments.reduce((sum, segment) => sum + segment.size, 0);
  const free = MEMORY_TOTAL_KB - used;

  document.getElementById('usedMemoryStat').textContent = `${used} KB`;
  document.getElementById('freeMemoryStat').textContent = `${free} KB`;
  document.getElementById('segmentCountStat').textContent = String(segments.length);
}

function renderMemory() {
  sortSegments();
  memoryCanvas.innerHTML = '';

  segments.forEach((segment) => {
    const element = document.createElement('div');
    const segmentTop = (segment.base / MEMORY_TOTAL_KB) * 100;
    const segmentHeight = (segment.size / MEMORY_TOTAL_KB) * 100;

    element.className = 'memory-segment';
    element.style.top = `${segmentTop}%`;
    element.style.height = `${segmentHeight}%`;
    element.style.background = `linear-gradient(180deg, ${segment.color}, rgba(15, 23, 42, 0.9))`;
    element.style.boxShadow = `inset 0 0 18px rgba(255,255,255,0.12), 0 0 16px ${segment.color}66`;
    element.setAttribute('data-label', segment.name);
    element.title = `${segment.name} · ${segment.size} KB · Base ${segment.base} KB`;
    memoryCanvas.appendChild(element);
  });

  updateStatistics();
}

function renderSegmentList() {
  segmentList.innerHTML = '';

  if (!segments.length) {
    segmentList.innerHTML = '<div class="empty-state">No hay segmentos activos.</div>';
    return;
  }

  segments.forEach((segment) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'segment-item';
    wrapper.innerHTML = `
      <div class="segment-item-header">
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="segment-dot" style="background:${segment.color};"></span>
          <span class="segment-name">${segment.name}</span>
        </div>
        <span style="font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#94a3b8;">${segment.type}</span>
      </div>
      <div class="segment-meta">
        <span>Base: <strong style="color:#7dd3fc;">${segment.base} KB</strong></span>
        <span>Límite: <strong style="color:#86efac;">${segment.size} KB</strong></span>
        <span>Permisos: <strong style="color:#c4b5fd;">${segment.permissions}</strong></span>
        <span>ID: <strong style="color:#fcd34d;">${segment.id}</strong></span>
      </div>
    `;
    segmentList.appendChild(wrapper);
  });
}

function renderDeleteOptions() {
  deleteSegmentSelect.innerHTML = '';
  segmentNumberSelect.innerHTML = '';

  if (!segments.length) {
    const emptyOption = document.createElement('option');
    emptyOption.textContent = 'Sin segmentos';
    emptyOption.value = '';
    deleteSegmentSelect.appendChild(emptyOption.cloneNode(true));
    segmentNumberSelect.appendChild(emptyOption.cloneNode(true));
    return;
  }

  segments.forEach((segment) => {
    const opt1 = document.createElement('option');
    opt1.value = segment.id;
    opt1.textContent = `${segment.id} · ${segment.name}`;
    deleteSegmentSelect.appendChild(opt1);

    const opt2 = opt1.cloneNode(true);
    segmentNumberSelect.appendChild(opt2);
  });
}

function renderSegmentTable() {
  segmentTableBody.innerHTML = '';

  segments.forEach((segment, index) => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td data-label="ID"><span style="font-weight:800; color:#7dd3fc;">${segment.id}</span></td>
      <td data-label="Segmento">
        <select class="segment-field" data-field="type" data-index="${index}">
          ${Object.keys(typePalette).map((type) => `<option value="${type}" ${segment.type === type ? 'selected' : ''}>${type}</option>`).join('')}
        </select>
      </td>
      <td data-label="Nombre">
        <input class="segment-field" data-field="name" data-index="${index}" value="${segment.name}" />
      </td>
      <td data-label="Base">
        <input class="segment-field" data-field="base" data-index="${index}" type="number" min="0" max="63" value="${segment.base}" />
      </td>
      <td data-label="Límite">
        <input class="segment-field" data-field="size" data-index="${index}" type="number" min="1" max="64" value="${segment.size}" />
      </td>
      <td data-label="Permisos">
        <select class="segment-field" data-field="permissions" data-index="${index}">
          ${['R--', 'RW-', 'R-X', 'RWX'].map((permission) => `<option value="${permission}" ${segment.permissions === permission ? 'selected' : ''}>${permission}</option>`).join('')}
        </select>
      </td>
    `;

    segmentTableBody.appendChild(tr);
  });
}

function refreshAll() {
  renderMemory();
  renderSegmentList();
  renderDeleteOptions();
  renderSegmentTable();
  if (segmentNumberSelect.value) {
    const active = segments.find((segment) => String(segment.id) === segmentNumberSelect.value);
    if (!active && segments[0]) {
      segmentNumberSelect.value = String(segments[0].id);
    }
  }
}

function setResult(mode, title, body) {
  translationResult.classList.remove('success', 'error');
  translationResult.classList.add(mode === 'success' ? 'success' : 'error');
  translationResult.innerHTML = `
    <p class="result-title">${title}</p>
    <p class="result-text">${body}</p>
  `;
}

document.getElementById('segmentForm').addEventListener('submit', (event) => {
  event.preventDefault();

  const type = document.getElementById('segmentType').value;
  const name = document.getElementById('segmentName').value.trim() || 'segmento';
  const size = Number(document.getElementById('segmentSize').value);

  if (!size || size <= 0) {
    alert('El tamaño del segmento debe ser mayor que 0 KB.');
    return;
  }

  const used = segments.reduce((sum, segment) => sum + segment.size, 0);
  const freeSpace = MEMORY_TOTAL_KB - used;

  if (size > freeSpace) {
    alert(`No hay suficiente memoria libre. Solicitas ${size} KB y solo quedan ${freeSpace} KB.`);
    return;
  }

  const base = findFirstAvailableHole(size);
  if (base === null) {
    alert('No existe un hueco suficiente para este segmento.');
    return;
  }

  segments.push({
    id: getNextSegmentId(),
    name,
    type,
    size,
    base,
    permissions: 'RW-',
    color: typePalette[type],
  });

  refreshAll();

  const form = document.getElementById('segmentForm');
  form.reset();
  document.getElementById('segmentType').value = 'Código';
  document.getElementById('segmentName').value = 'Proceso_A';
  document.getElementById('segmentSize').value = '8';
});

document.getElementById('deleteSegmentButton').addEventListener('click', () => {
  const selectedId = Number(deleteSegmentSelect.value);
  if (!selectedId) {
    alert('Selecciona un segmento para eliminar.');
    return;
  }

  segments = segments.filter((segment) => segment.id !== selectedId);
  refreshAll();
});

document.getElementById('compactButton').addEventListener('click', () => {
  const nextSegments = [...segments].sort((a, b) => a.base - b.base);
  let currentBase = 0;

  nextSegments.forEach((segment) => {
    segment.base = currentBase;
    currentBase += segment.size;
  });

  segments = nextSegments;
  refreshAll();

  memoryCanvas.animate(
    [
      { transform: 'scale(0.98)', opacity: 0.74 },
      { transform: 'scale(1)', opacity: 1 },
    ],
    { duration: 620, easing: 'ease-in-out' }
  );
});

document.addEventListener('input', (event) => {
  const target = event.target;
  if (!target.classList.contains('segment-field')) return;

  const field = target.dataset.field;
  const index = Number(target.dataset.index);
  const segment = segments[index];
  if (!segment) return;

  if (field === 'type') {
    segment.type = target.value;
    segment.color = typePalette[target.value];
  }

  if (field === 'name') {
    segment.name = target.value || 'segmento';
  }

  if (field === 'base') {
    segment.base = Math.max(0, Math.min(Number(target.value) || 0, MEMORY_TOTAL_KB));
  }

  if (field === 'size') {
    segment.size = Math.max(1, Number(target.value) || 1);
  }

  if (field === 'permissions') {
    segment.permissions = target.value;
  }

  sortSegments();
  refreshAll();
});

document.getElementById('translationForm').addEventListener('submit', (event) => {
  event.preventDefault();

  const selectedId = Number(document.getElementById('segmentNumber').value);
  const offset = Number(document.getElementById('offsetInput').value);
  const segment = segments.find((item) => item.id === selectedId);

  if (!segment) {
    setResult('error', 'Segmento no encontrado', 'Selecciona un segmento válido para realizar la traducción.');
    return;
  }

  const limit = segment.size;
  const physicalAddress = segment.base + offset;

  if (offset > limit) {
    setResult(
      'error',
      '¡TRAP GENERADO! Violación de límite de segmento',
      `Se intentó acceder con un desplazamiento de <strong>${offset}</strong> KB, pero el segmento <strong>${segment.name}</strong> tiene límite <strong>${limit}</strong> KB. La regla es: dirección física = base + offset, y el desplazamiento debe ser menor o igual al tamaño del segmento.`
    );
    return;
  }

  setResult(
    'success',
    'Traducción correcta',
    `Segmento: <strong>${segment.name}</strong> (ID ${segment.id})<br>Base: <strong>${segment.base}</strong> KB<br>Offset: <strong>${offset}</strong> KB<br>Validación: <strong>${offset} ≤ ${limit}</strong> → permitido<br>Cálculo: <strong>${segment.base} + ${offset} = ${physicalAddress}</strong> KB<br>Dirección física final: <strong>${physicalAddress} KB</strong>`
  );
});

function openGuide() {
  guideModal.classList.add('visible');
}

function closeGuide() {
  guideModal.classList.remove('visible');
}

document.getElementById('guideButton').addEventListener('click', openGuide);
document.getElementById('closeGuideButton').addEventListener('click', closeGuide);
guideModal.addEventListener('click', (event) => {
  if (event.target === guideModal) closeGuide();
});

document.querySelectorAll('.tab-button').forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.tab;

    document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.add('hidden'));
    document.querySelectorAll('.tab-button').forEach((item) => item.classList.remove('active'));

    button.classList.add('active');
    document.getElementById(`tab-${target}`).classList.remove('hidden');
  });
});

function initializeDefaults() {
  refreshAll();
  document.getElementById('segmentNumber').value = String(segments[0]?.id ?? '');
  lucide.createIcons();
}

initializeDefaults();
