document.addEventListener('DOMContentLoaded', () => {
  const tabBar = document.querySelector('.presetTabs');
  const sideInner = document.querySelector('.sideInner');
  const sseToggle = document.getElementById('sseToggle');

  if (!tabBar || !sideInner || !sseToggle) return;

  const stormPalettes = {
    red: {
      label: 'Red',
      background: '#A81E23',
      text: '#FFFFFF'
    },
    amber: {
      label: 'Amber',
      background: '#F6A400',
      text: '#000000'
    },
    yellow: {
      label: 'Yellow',
      background: '#FFD400',
      text: '#000000'
    },
    blue: {
      label: 'Blue',
      background: '#003E66',
      text: '#FFFFFF'
    }
  };

  const stormTab = document.createElement('button');
  stormTab.className = 'presetTab stormOnly';
  stormTab.type = 'button';
  stormTab.dataset.tab = 'storm';
  stormTab.textContent = 'Storm';

  tabBar.appendChild(stormTab);

  const panel = document.createElement('div');
  panel.className = 'tabPanel';
  panel.id = 'panel-storm';

  panel.innerHTML = `
    <p class="stormIntro">Create a 1080×1350 storm update graphic based on the SSEN storm PSD template.</p>

    <div class="stormBuilder">
      <div class="stormControls">
        <div class="stormField">
          <label for="stormName">Storm name</label>
          <input id="stormName" value="XXX" aria-describedby="stormNameHelp" />
          <div class="stormNote" id="stormNameHelp">This creates the text: STORM XXX UPDATE</div>
        </div>

        <div class="stormControlGrid">
          <div class="stormField">
            <label for="stormBackground">Background</label>
            <select id="stormBackground">
              <option value="red" selected>Red</option>
              <option value="amber">Amber</option>
              <option value="yellow">Yellow</option>
              <option value="blue">Blue</option>
            </select>
          </div>

          <div class="stormField">
            <label for="stormFontSize">Font size</label>
            <input id="stormFontSize" type="range" min="90" max="170" value="136" />
            <div class="stormNote"><span id="stormFontSizeValue">136</span>px</div>
          </div>
        </div>
      </div>

      <div class="stormPreviewWrap">
        <canvas id="stormCanvas" class="stormCanvas" width="1080" height="1350"></canvas>

        <div class="stormActions">
          <button class="btn primary" type="button" id="downloadStormGraphic">Download storm graphic</button>
          <button class="btn ghost" type="button" id="refreshStormGraphic">Refresh preview</button>
        </div>

        <div class="stormNote">Text colour is automatic: white on red/blue, black on amber/yellow.</div>
      </div>
    </div>
  `;

  sideInner.appendChild(panel);

  function activateStormTab(){
    document.querySelectorAll('.presetTab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tabPanel').forEach(p => p.classList.remove('active'));

    stormTab.classList.add('active');
    panel.classList.add('active');

    renderStormGraphic();
  }

  stormTab.addEventListener('click', activateStormTab);

  function drawLightning(ctx, colour){
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(642, 218);
    ctx.lineTo(565, 538);
    ctx.lineTo(658, 538);
    ctx.lineTo(585, 860);
    ctx.lineTo(790, 458);
    ctx.lineTo(685, 458);
    ctx.closePath();
    ctx.fill();
  }

  function renderStormGraphic(){
    const canvas = document.getElementById('stormCanvas');
    if(!canvas) return;

    const ctx = canvas.getContext('2d');
    const stormNameField = document.getElementById('stormName');
    const backgroundField = document.getElementById('stormBackground');
    const fontSizeField = document.getElementById('stormFontSize');
    const fontSizeValue = document.getElementById('stormFontSizeValue');

    const palette = stormPalettes[backgroundField.value] || stormPalettes.red;
    const stormName = (stormNameField.value || 'XXX').trim().toUpperCase();
    const fontSize = Number(fontSizeField.value) || 136;

    if(fontSizeValue) fontSizeValue.textContent = String(fontSize);

    ctx.clearRect(0, 0, 1080, 1350);
    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, 1080, 1350);

    ctx.save();
    ctx.globalAlpha = 0.16;
    drawLightning(ctx, palette.text);
    ctx.restore();

    ctx.fillStyle = palette.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${fontSize}px Arial Black, Arial, sans-serif`;

    const lines = ['STORM', stormName, 'UPDATE'];
    const lineGap = fontSize * 1.06;
    const startY = 675 - lineGap;

    lines.forEach((line, index) => {
      fitAndFillText(ctx, line, 540, startY + (index * lineGap), 920, fontSize);
    });
  }

  function fitAndFillText(ctx, text, x, y, maxWidth, baseFontSize){
    let size = baseFontSize;

    while(size > 48){
      ctx.font = `900 ${size}px Arial Black, Arial, sans-serif`;
      if(ctx.measureText(text).width <= maxWidth) break;
      size -= 2;
    }

    ctx.fillText(text, x, y);
  }

  ['stormName', 'stormBackground', 'stormFontSize'].forEach(id => {
    document.addEventListener('input', (e) => {
      if(e.target && e.target.id === id){
        renderStormGraphic();
      }
    });

    document.addEventListener('change', (e) => {
      if(e.target && e.target.id === id){
        renderStormGraphic();
      }
    });
  });

  document.addEventListener('click', (e) => {
    if(e.target && e.target.id === 'refreshStormGraphic'){
      renderStormGraphic();
    }

    if(e.target && e.target.id === 'downloadStormGraphic'){
      renderStormGraphic();

      const canvas = document.getElementById('stormCanvas');
      const link = document.createElement('a');
      const stormName = (document.getElementById('stormName').value || 'xxx').trim().toLowerCase();
      const background = document.getElementById('stormBackground').value || 'red';

      link.download = `storm-${stormName.replace(/[^a-z0-9]+/g,'-')}-update-${background}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  });

  function updateStormVisibility(){
    const isSseSkin = sseToggle.checked;
    stormTab.style.display = isSseSkin ? 'none' : 'inline-flex';

    if(isSseSkin && stormTab.classList.contains('active')){
      document.querySelector('.presetTab[data-tab="article"]')?.click();
    }
  }

  sseToggle.addEventListener('change', updateStormVisibility);

  updateStormVisibility();
  renderStormGraphic();
});
