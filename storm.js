document.addEventListener('DOMContentLoaded', () => {
  const tabBar = document.querySelector('.presetTabs');
  const sideInner = document.querySelector('.sideInner');
  const sseToggle = document.getElementById('sseToggle');

  if (!tabBar || !sideInner || !sseToggle) return;

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
    <p class="stormIntro">Create a ready-to-post 1080×1350 storm update graphic for social media.</p>

    <div class="stormBuilder">
      <div class="stormControls">

        <div class="stormControlGrid">
          <div class="stormField">
            <label>Storm name</label>
            <input id="stormName" value="Storm Floris" />
          </div>

          <div class="stormField">
            <label>Status</label>
            <select id="stormStatus">
              <option>Red weather warning</option>
              <option selected>Amber weather warning</option>
              <option>Yellow weather warning</option>
            </select>
          </div>
        </div>

        <div class="stormField">
          <label>Headline</label>
          <input id="stormHeadline" value="We're preparing for Storm Floris" />
        </div>

        <div class="stormField">
          <label>Body copy</label>
          <textarea id="stormBody">Strong winds are forecast across our network area. Our teams are preparing and ready to respond if power cuts occur. Keep updated through Power Track and save 105 in case you need us.</textarea>
        </div>

        <div class="stormControlGrid">
          <div class="stormField">
            <label>Footer line 1</label>
            <input id="stormFooter1" value="Power cuts & updates: ssen.co.uk/powertrack" />
          </div>

          <div class="stormField">
            <label>Footer line 2</label>
            <input id="stormFooter2" value="Call 105 in an emergency" />
          </div>
        </div>
      </div>

      <div class="stormPreviewWrap">
        <canvas id="stormCanvas" class="stormCanvas" width="1080" height="1350"></canvas>

        <div class="stormActions">
          <button class="btn primary" type="button" id="downloadStormGraphic">Download graphic</button>
          <button class="btn ghost" type="button" id="refreshStormGraphic">Refresh preview</button>
        </div>

        <div class="stormNote">The preview uses the current SSEN branding colours and exports at full social resolution.</div>
      </div>
    </div>
  `;

  sideInner.appendChild(panel);

  const stormInputs = [
    'stormName',
    'stormStatus',
    'stormHeadline',
    'stormBody',
    'stormFooter1',
    'stormFooter2'
  ];

  function activateStormTab(){
    document.querySelectorAll('.presetTab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tabPanel').forEach(p => p.classList.remove('active'));

    stormTab.classList.add('active');
    panel.classList.add('active');

    renderStormGraphic();
  }

  stormTab.addEventListener('click', activateStormTab);

  function renderStormGraphic(){
    const canvas = document.getElementById('stormCanvas');
    if(!canvas) return;

    const ctx = canvas.getContext('2d');

    const stormName = document.getElementById('stormName').value;
    const status = document.getElementById('stormStatus').value;
    const headline = document.getElementById('stormHeadline').value;
    const body = document.getElementById('stormBody').value;
    const footer1 = document.getElementById('stormFooter1').value;
    const footer2 = document.getElementById('stormFooter2').value;

    ctx.clearRect(0,0,1080,1350);

    ctx.fillStyle = '#13294B';
    ctx.fillRect(0,0,1080,1350);

    ctx.fillStyle = '#F37021';
    ctx.fillRect(0,0,1080,26);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 44px Arial';
    ctx.fillText('SSEN Distribution', 72, 100);

    ctx.fillStyle = '#F37021';
    ctx.fillRect(72,150,420,64);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 34px Arial';
    ctx.fillText(status.toUpperCase(), 96, 192);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 72px Arial';
    wrapText(ctx, stormName, 72, 330, 920, 82);

    ctx.font = '700 56px Arial';
    wrapText(ctx, headline, 72, 500, 920, 66);

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(72,620,936,360);

    ctx.fillStyle = '#ffffff';
    ctx.font = '400 38px Arial';
    wrapText(ctx, body, 108, 700, 860, 54);

    ctx.fillStyle = '#F37021';
    ctx.fillRect(0,1160,1080,190);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 34px Arial';
    ctx.fillText(footer1,72,1238);

    ctx.font = '700 44px Arial';
    ctx.fillText(footer2,72,1300);
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight){
    const words = text.split(' ');
    let line = '';

    for(let n = 0; n < words.length; n++){
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if(testWidth > maxWidth && n > 0){
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }

    ctx.fillText(line, x, y);
  }

  stormInputs.forEach(id => {
    document.addEventListener('input', (e) => {
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
      const stormName = document.getElementById('stormName').value || 'storm-update';

      link.download = `${stormName.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-graphic.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  });

  function updateStormVisibility(){
    const isSSEN = sseToggle.checked;
    stormTab.style.display = isSSEN ? 'none' : 'inline-flex';

    if(!isSSEN && stormTab.classList.contains('active')){
      document.querySelector('.presetTab[data-tab="article"]')?.click();
    }
  }

  sseToggle.addEventListener('change', updateStormVisibility);

  updateStormVisibility();
  renderStormGraphic();
});
