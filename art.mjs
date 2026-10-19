/**
 * Native Plush Pop artwork for a Canvas 2D companion; original asset bytes stay intact.
 *
 * const art = await Art.load('.'); // root containing assets/; art.ready is now true
 * await art.preload(['char_stitch', 'puffy_stage', 'icon_pause', 'power_stitch_0']);
 * art.draw(ctx, 'char_stitch', x, y, 52, 52, {bodyDiameter: 52, angle: 0.2});
 * art.silhouette(ctx, 'char_stitch', x, y, 52, 0.2); // exterior rim only
 * art.label(ctx, 'Plush Pop', 270, 100, 40);
 *
 * load() fetches metadata and the two bitmap font sheets, never the full roster.
 * preload(keys) fetches only requested sprites and their shared sheets/dependencies.
 * Drawing never fetches: absent or unloaded keys politely return false. sources is
 * a Map of resolved URLs to decoded images; failed is a Map of URL to load error.
 * onProgress(fraction, {loaded,total,key}) reports each load/preload batch.
 * All positions use Canvas coordinates, all angles radians. label() is centered.
 * bodyDiameter overrides w/h for measured characters, preserving native anchors.
 * stage() uses the native 540 × 960 logical stage; apply your viewport transform first.
 */

const ALIASES = {
  stage: 'puffy_stage', bg_gameplay_blue: 'puffy_stage', bg_gameplay_fever: 'puffy_stage',
  bg_menu: 'puffy_stage', bg_collection: 'puffy_stage', bg_results: 'puffy_stage', bg_shop: 'puffy_stage',
  icon_coin: 'vfx_coin', selection_ring: 'vfx_ring', chain_link: 'vfx_ribbon', chain_node: 'vfx_sparkle',
  panel_blue: 'panel_dark', panel_navy: 'panel_dark', card_blue: 'panel_teal', card_cream: 'panel_cream',
  score_pill: 'meter_track', coin_pill: 'meter_track', skill_frame: 'panel_teal', tooltip: 'wide_teal',
  timer_face: 'round_teal', meter_navy: 'meter_track', meter_pink: 'meter_coral',
  meter_purple: 'wide_lavender', meter_green: 'wide_teal', meter_cyan: 'wide_teal',
};
const BUBBLES = {blast: 'star', time: 'clock', coin: 'coin', score: 'trophy'};
const TAU = Math.PI * 2;
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const finite = (n, fallback) => Number.isFinite(n) ? n : fallback;

function canvas(width, height) {
  const result = document.createElement('canvas');
  result.width = Math.max(1, Math.ceil(width));
  result.height = Math.max(1, Math.ceil(height));
  return result;
}

function remember(cache, key, value, limit) {
  cache.delete(key);
  cache.set(key, value);
  while (cache.size > limit) cache.delete(cache.keys().next().value);
  return value;
}

function cached(cache, key) {
  const value = cache.get(key);
  if (value) { cache.delete(key); cache.set(key, value); }
  return value;
}

export class Art {
  constructor(base = '.', onProgress = () => {}) {
    const location = globalThis.document?.baseURI || globalThis.location?.href || 'http://localhost/';
    // Also accept the original assets/ spelling without producing assets/assets/.
    const path = String(base).replace(/\/+$/, '').replace(/(?:^|\/)assets$/, '') || '.';
    this.base = new URL(`${path}/`, location);
    this.onProgress = typeof onProgress === 'function' ? onProgress : () => {};
    this.ready = false;
    this.images = {};
    this.bodies = {};
    this.font = {glyphs: {}, paths: {}};
    this.sources = new Map();
    this.failed = new Map();
    this._pending = new Map();
    this._sprites = new Map();
    this._crops = new Map();
    this._grays = new Map();
    this._rims = new Map();
    this._words = new Map();
    this._panels = new Map();
    this._fabrics = new Map();
    this._fabricPixels = 0;
    this.fever = false;
    this.phase = 0;
  }

  static async load(base = '.', onProgress = () => {}) {
    const art = new Art(base, onProgress);
    const paths = ['assets/native-art.json', 'assets/native-bodies.json', 'assets/font/plush-stitch.json'];
    let loaded = 0;
    const data = await Promise.all(paths.map(async path => {
      const response = await fetch(art.url(path));
      if (!response.ok) throw new Error(`Artwork metadata could not load: ${path} (${response.status})`);
      const result = await response.json();
      art._progress(++loaded, 5, path);
      return result;
    }));
    [art.images, art.bodies, art.font] = data;
    const fonts = Object.values(art.font.paths);
    const total = 3 + fonts.length;
    await Promise.all(fonts.map(async path => {
      const source = await art._source(path);
      if (!source) throw art.failed.get(art.url(path));
      art._progress(++loaded, total, path);
    }));
    art.ready = true;
    return art;
  }

  url(path) { return new URL(path, this.base).href; }

  _progress(loaded, total, key) {
    this.onProgress(total ? loaded / total : 1, {loaded, total, key});
  }

  _source(path) {
    const url = this.url(path);
    if (this.sources.has(url)) return Promise.resolve(this.sources.get(url));
    if (this._pending.has(url)) return this._pending.get(url);
    const request = new Promise(resolve => {
      const image = new Image();
      image.decoding = 'async';
      if (new URL(url).origin !== new URL(document.baseURI).origin) image.crossOrigin = 'anonymous';
      image.onload = () => {
        this.sources.set(url, image);
        this.failed.delete(url);
        resolve(image);
      };
      image.onerror = () => {
        this.failed.set(url, new Error(`Artwork could not load: ${path}`));
        resolve(null);
      };
      image.src = url;
    });
    this._pending.set(url, request);
    request.finally(() => this._pending.delete(url));
    return request;
  }

  resolve(key) {
    if (typeof key !== 'string') return null;
    const seen = new Set();
    while (!seen.has(key)) {
      seen.add(key);
      const info = this.images[key];
      if (info && typeof info === 'object' && info.path) return key;
      if (typeof info === 'string') { key = info; continue; }
      if (info?.alias) { key = info.alias; continue; }
      if (key.startsWith('bubble_') && BUBBLES[key.slice(7)]) return key;
      if (ALIASES[key]) { key = ALIASES[key]; continue; }
      const button = key.match(/^button_(gold|blue|purple|pink|green)_(round|wide)(?:_(normal|pressed|selected|disabled))?$/);
      if (button) {
        const [, color, shape, state] = button;
        const tone = state === 'selected' || color === 'gold' ? 'gold'
          : color === 'purple' && shape === 'wide' ? 'lavender'
          : color === 'pink' && shape === 'round' ? 'coral' : 'teal';
        key = `${shape}_${tone}`;
        continue;
      }
      if (this.images[`char_${key}`]) { key = `char_${key}`; continue; }
      if (key.startsWith('power_') && this.images[`${key}_0`]) { key = `${key}_0`; continue; }
      return null;
    }
    return null;
  }

  async preload(keys = []) {
    if (typeof keys === 'string') keys = [keys];
    const requested = [...new Set(Array.from(keys || [], key => this.resolve(key)).filter(Boolean))];
    const dependencies = new Set(requested);
    for (const key of requested) if (key.startsWith('bubble_')) {
      dependencies.add(this.resolve('vfx_ring'));
      dependencies.add(this.resolve(`icon_${BUBBLES[key.slice(7)]}`));
    }
    const paths = [...new Set([...dependencies].map(key => this.images[key]?.path).filter(Boolean))];
    let loaded = 0;
    this._progress(0, paths.length, null);
    // Bound concurrent decodes on mobile; shared sheet requests are deduplicated.
    let next = 0;
    await Promise.all(Array.from({length: Math.min(4, paths.length)}, async () => {
      while (next < paths.length) {
        const path = paths[next++];
        await this._source(path);
        this._progress(++loaded, paths.length, path);
      }
    }));
    for (const key of dependencies) this.get(key);
    return this;
  }

  /** Return a loaded canvas/image without starting a request. */
  get(key) {
    key = this.resolve(key);
    if (!key) return null;
    if (this._sprites.has(key)) return this._sprites.get(key);
    if (key.startsWith('bubble_')) {
      const ring = this.get('vfx_ring'), icon = this.get(`icon_${BUBBLES[key.slice(7)]}`);
      if (!ring || !icon) return null;
      const tile = canvas(128, 128), ctx = tile.getContext('2d');
      ctx.drawImage(ring, 0, 0, 128, 128);
      ctx.drawImage(icon, 39, 39, 50, 50);
      this._sprites.set(key, tile);
      return tile;
    }
    const info = this.images[key], source = this.sources.get(this.url(info.path));
    if (!source) return null;
    const signature = `${info.path}:${info.rect?.join(',') || ''}`;
    let tile = this._crops.get(signature);
    if (!tile) {
      tile = source;
      if (info.rect) {
        const [x, y, width, height] = info.rect;
        if (!(width > 0 && height > 0)) return null;
        tile = canvas(width, height);
        tile.getContext('2d').drawImage(source, x, y, width, height, 0, 0, width, height);
      }
      this._crops.set(signature, tile);
    }
    this._sprites.set(key, tile);
    return tile;
  }

  _placement(key, source, w, h, bodyDiameter) {
    const body = this.bodies[key];
    if (body && Number.isFinite(bodyDiameter) && bodyDiameter > 0 && body.diameter > 0) {
      const scale = bodyDiameter / body.diameter;
      return {x: -body.cx * scale, y: -body.cy * scale, w: body.width * scale, h: body.height * scale};
    }
    w = finite(w, source.width);
    h = finite(h, w * source.height / source.width);
    return {x: -w / 2, y: -h / 2, w, h};
  }

  _paint(ctx, source, cx, cy, placement, options = {}) {
    if (!source || placement.w <= 0 || placement.h <= 0) return false;
    ctx.save();
    ctx.globalAlpha *= clamp(finite(options.alpha, 1), 0, 1);
    ctx.translate(cx, cy);
    if (options.angle) ctx.rotate(options.angle);
    if (options.scaleX !== undefined || options.scaleY !== undefined) {
      ctx.scale(finite(options.scaleX, 1), finite(options.scaleY, 1));
    }
    ctx.drawImage(source, placement.x, placement.y, placement.w, placement.h);
    ctx.restore();
    return true;
  }

  draw(ctx, key, cx, cy, w, h, options = {}) {
    key = this.resolve(key);
    const source = this.get(key);
    if (!source) return false;
    const picture = this.images[key]?.slice ? this._panel(key,source,w,h) : options.gray ? this._gray(key, source) : source;
    const placement=this._placement(options.bodyKey||key, source, w, h, options.bodyDiameter);
    if(this.preparingFever && options.rainbow!==false && !/^(char_|skin_|idle_)/.test(key))this._fabric(key+':'+picture.width+':'+picture.height,picture);
    if(this.fever && options.rainbow!==false && !/^(char_|skin_|idle_)/.test(key)) {
      const frames=this._fabric(key+':'+picture.width+':'+picture.height,picture),cycle=(this.phase*.07%1)*3,index=Math.floor(cycle),blend=cycle-index;
      this._paint(ctx,frames[index],cx,cy,placement,options);
      return this._paint(ctx,frames[(index+1)%3],cx,cy,placement,{...options,alpha:(options.alpha??1)*blend});
    }
    return this._paint(ctx, picture, cx, cy, placement, options);
  }
  _panel(key,source,w,h){
    const id=key+':'+w+':'+h,old=cached(this._panels,id);if(old)return old;
    const tile=canvas(w*2,h*2),c=tile.getContext('2d'),cap=this.images[key].slice,edge=Math.min(24,w/3,h/3);
    const sx=[0,cap,source.width-cap,source.width],sy=[0,cap,source.height-cap,source.height],dx=[0,edge,w-edge,w],dy=[0,edge,h-edge,h];c.scale(2,2);
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){
      const sw=sx[col+1]-sx[col],sh=sy[row+1]-sy[row],tw=sw*edge/cap,th=sh*edge/cap;
      if(row===1&&col===1){c.drawImage(source,sx[col],sy[row],sw,sh,dx[col],dy[row],dx[col+1]-dx[col],dy[row+1]-dy[row]);continue;}
      c.save();c.beginPath();c.rect(dx[col],dy[row],dx[col+1]-dx[col],dy[row+1]-dy[row]);c.clip();
      for(let y=dy[row];y<dy[row+1];y+=th)for(let x=dx[col];x<dx[col+1];x+=tw)c.drawImage(source,sx[col],sy[row],sw,sh,x,y,tw,th);
      c.restore();
    }
    return remember(this._panels,id,tile,24);
  }

  gray(ctx, key, cx, cy, w, h, options = {}) {
    return this.draw(ctx, key, cx, cy, w, h, {...options, gray: true});
  }

  _gray(key, source) {
    let tile = cached(this._grays, key);
    if (tile) return tile;
    tile = canvas(source.width, source.height);
    const ctx = tile.getContext('2d');
    ctx.drawImage(source, 0, 0);
    try {
      const pixels = ctx.getImageData(0, 0, tile.width, tile.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const light = pixels.data[i] * 0.2126 + pixels.data[i + 1] * 0.7152 + pixels.data[i + 2] * 0.0722;
        const gray = Math.min(255, light * 0.82 + 255 * 0.18);
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = gray;
      }
      ctx.putImageData(pixels, 0, 0);
    } catch { return source; }
    return remember(this._grays, key, tile, 64);
  }

  /** Draw only the alpha-shaped exterior rim; colored artwork/faces stay visible. */
  silhouette(ctx, key, cx, cy, diameter, angle = 0, color = 'cyan', width = 3) {
    key = this.resolve(key);
    const source = this.get(key);
    if (!source || !(diameter > 0 && width > 0)) return false;
    const body = this.bodies[key];
    const scale = Math.min(1, 256 / Math.max(source.width, source.height));
    const sw = Math.ceil(source.width * scale), sh = Math.ceil(source.height * scale);
    const nativeDiameter = body ? body.diameter / body.width * sw : sw;
    const radius = clamp(Math.round(width / diameter * nativeDiameter * 2) / 2, 0.5, 48);
    const cacheKey = `${key}|${color}|${radius}`;
    let rim = cached(this._rims, cacheKey);
    if (!rim) {
      const pad = Math.ceil(radius) + 2, tile = canvas(sw + pad * 2, sh + pad * 2);
      const c = tile.getContext('2d');
      // Dilation followed by subtraction leaves an exterior ring, with no face fill.
      const steps = Math.max(16, Math.ceil(TAU * radius));
      for (let i = 0; i < steps; i++) {
        const a = i / steps * TAU;
        c.drawImage(source, pad + Math.cos(a) * radius, pad + Math.sin(a) * radius, sw, sh);
      }
      c.globalCompositeOperation = 'source-in';
      c.fillStyle = color;
      c.fillRect(0, 0, tile.width, tile.height);
      c.globalCompositeOperation = 'destination-out';
      c.drawImage(source, pad, pad, sw, sh);
      c.globalCompositeOperation = 'source-over';
      rim = remember(this._rims, cacheKey, {tile, pad, sw, sh}, 64);
    }
    const p = this._placement(key, source, diameter, diameter, body ? diameter : undefined);
    const px = p.w / rim.sw, py = p.h / rim.sh;
    return this._paint(ctx, rim.tile, cx, cy, {
      x: p.x - rim.pad * px, y: p.y - rim.pad * py,
      w: rim.tile.width * px, h: rim.tile.height * py,
    }, {angle});
  }

  label(ctx, text, x, y, size, maxWidth = 490, options = {}) {
    if (!this.ready || !(size > 0 && maxWidth > 0)) return false;
    text = String(text).replace(/[—–]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
    const key = `${text}|${size}`;
    let word = cached(this._words, key);
    if (!word) {
      const cap = size * 0.74;
      const glyphs = [...text].map(char => this.font.glyphs[char] || this.font.glyphs['?']);
      const width = Math.max(1, glyphs.reduce((n, g) => n + (g?.advance || 0), 0) * cap + 4);
      const height = cap * 1.5 + 4;
      // Two pixels per logical unit matches the native font renderer; cap allocation.
      const density = Math.min(2, 4096 / width, 1024 / height);
      const tile = canvas(width * density, height * density), c = tile.getContext('2d');
      c.scale(density, density);
      let gx = 2;
      const baseline = 2 + cap * 1.1;
      for (const g of glyphs) {
        if (!g) continue;
        const source = g.sheet && this.sources.get(this.url(this.font.paths[g.sheet]));
        if (g.rect && source) {
          const [sx, sy, sw, sh] = g.rect;
          const gh = (g.height ?? 1) * cap;
          const gy = baseline + ((g.descent ?? 0) - (g.height ?? 1) - (g.raise ?? 0)) * cap;
          c.drawImage(source, sx, sy, sw, sh, gx, gy, (g.width ?? 1) * cap, gh);
        }
        gx += g.advance * cap;
      }
      word = remember(this._words, key, {tile, width, height}, 96);
    }
    const scale = Math.min(1, maxWidth / word.width);
    return this._paint(ctx, word.tile, x, y, {
      x: -word.width * scale / 2, y: -word.height * scale / 2,
      w: word.width * scale, h: word.height * scale,
    }, options);
  }

  // Three cached fabric dyes crossfade with the same phase used by the native
  // shader. Texture/alpha remain intact; characters and gold target coins opt out.
  // Pixel work is never repeated per frame. The cache is limited to 48 MiB.
  _fabric(key,source) {
    const old=cached(this._fabrics,key);if(old)return old;
    const scale=Math.min(1,640/Math.max(source.width,source.height));
    const width=Math.ceil(source.width*scale),height=Math.ceil(source.height*scale),tile=canvas(width,height),c=tile.getContext('2d');
    c.drawImage(source,0,0,width,height);
    let original;try{original=c.getImageData(0,0,width,height);}catch{return [source,source,source];}
    const frames=Array.from({length:3},()=>canvas(width,height)),contexts=frames.map(f=>f.getContext('2d'));
    const pixels=contexts.map(fc=>fc.createImageData(width,height)),outputs=pixels.map(p=>p.data),src=original.data;
    // The three phases are RGB permutations of the same dye. Calculate light
    // once per pixel and trigonometry once per row/column, not nine cosines per pixel.
    const cosX=Float64Array.from({length:width},(_,x)=>Math.cos(TAU*x/width*.6));
    const sinX=Float64Array.from({length:width},(_,x)=>Math.sin(TAU*x/width*.6));
    for(let y=0;y<height;y++){
      const cy=Math.cos(TAU*(1-y/height)*.8),sy=Math.sin(TAU*(1-y/height)*.8);
      for(let x=0;x<width;x++){
        const i=(y*width+x)*4,light=(src[i]*.2126+src[i+1]*.7152+src[i+2]*.0722)/255,shine=Math.max(0,light-.72)*.3;
        const co=cosX[x]*cy-sinX[x]*sy,si=sinX[x]*cy+cosX[x]*sy;
        const red=255*clamp((.55+.45*co)*light*1.45+shine,0,1),green=255*clamp((.55+.45*(-.5*co-.866025403784*si))*light*1.45+shine,0,1),blue=255*clamp((.55+.45*(-.5*co+.866025403784*si))*light*1.45+shine,0,1);
        const a=outputs[0],b=outputs[1],c=outputs[2];
        a[i]=red;a[i+1]=green;a[i+2]=blue;a[i+3]=src[i+3];
        b[i]=green;b[i+1]=blue;b[i+2]=red;b[i+3]=src[i+3];
        c[i]=blue;c[i+1]=red;c[i+2]=green;c[i+3]=src[i+3];
      }
    }
    contexts.forEach((fc,i)=>fc.putImageData(pixels[i],0,0));
    this._fabricPixels+=width*height*3;this._fabrics.set(key,frames);
    while(this._fabricPixels>12000000&&this._fabrics.size>1){const id=this._fabrics.keys().next().value,first=this._fabrics.get(id);this._fabricPixels-=first[0].width*first[0].height*3;this._fabrics.delete(id);}
    return frames;
  }
  stage(ctx, fever = false, phase = 0, motion = true) {
    this.fever=fever;this.phase=motion?phase:0;
    return this.draw(ctx,'puffy_stage',270,480,540,960);
  }
}
