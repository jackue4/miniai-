import React, { FormEvent, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const baseShotUrl = new URL('../assest/20260509-191859.jpg', import.meta.url).href;

type CubeState = {
  scale: number;
  color: '默认材质' | '红色' | '蓝色' | '绿色';
  material: '默认材质' | '金属质感' | '发光材质';
};

type Proposal = {
  scale: number;
  color: CubeState['color'];
  material: CubeState['material'];
  summary: string[];
};

const cubeColors: Record<CubeState['color'], string> = {
  默认材质: '#ffffff',
  红色: '#f42b2b',
  蓝色: '#1f62ff',
  绿色: '#1ec969',
};

function parsePrompt(prompt: string, current: CubeState): Proposal {
  let scale = current.scale;
  let color = current.color;
  let material = current.material;

  if (prompt.includes('红')) color = '红色';
  if (prompt.includes('蓝')) color = '蓝色';
  if (prompt.includes('绿')) color = '绿色';
  if (prompt.includes('默认') || prompt.includes('重置')) color = '默认材质';

  if (prompt.includes('金属')) material = '金属质感';
  if (prompt.includes('发光')) material = '发光材质';
  if (prompt.includes('默认') || prompt.includes('重置')) material = '默认材质';

  const scaleMatch = prompt.match(/(\d+(?:\.\d+)?)\s*倍/);
  if (scaleMatch) {
    scale = Number(scaleMatch[1]);
  } else if (prompt.includes('大')) {
    scale = Math.min(3, Number((current.scale + 0.5).toFixed(1)));
  } else if (prompt.includes('小')) {
    scale = Math.max(0.5, Number((current.scale - 0.3).toFixed(1)));
  }

  if (prompt.includes('重置')) {
    scale = 1;
    color = '默认材质';
    material = '默认材质';
  }

  return {
    scale,
    color,
    material,
    summary: [`材质颜色修改为${color}`, `物体缩放调整为 ${scale} 倍`, `材质效果设置为${material}`],
  };
}

function App() {
  const [aiOpen, setAiOpen] = useState(true);
  const [prompt, setPrompt] = useState('把这个立方体变大一点，颜色改为红色，并且放大 2 倍');
  const [cube, setCube] = useState<CubeState>({ scale: 1, color: '默认材质', material: '默认材质' });
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [applied, setApplied] = useState<string[]>([]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) return;
    setAiOpen(true);
    setProposal(parsePrompt(prompt, cube));
  };

  const apply = () => {
    if (!proposal) return;
    setCube({ scale: proposal.scale, color: proposal.color, material: proposal.material });
    setApplied(proposal.summary);
    setProposal(null);
  };

  const reset = () => {
    setCube({ scale: 1, color: '默认材质', material: '默认材质' });
    setProposal(null);
    setApplied([]);
    setPrompt('把这个立方体变大一点，颜色改为红色，并且放大 2 倍');
  };

  return (
    <main className="page">
      <section className={`prototype ${aiOpen ? 'is-ai-open' : ''} ${applied.length ? 'is-applied' : ''}`}>
        <img className="base-shot" src={baseShotUrl} alt="迷你世界编辑器底图" />
        <div className="right-mask" />
        <LiveCubeOverlay cube={cube} />
        <PropertyOverlay
          aiOpen={aiOpen}
          setAiOpen={setAiOpen}
          prompt={prompt}
          setPrompt={setPrompt}
          submit={submit}
          proposal={proposal}
          apply={apply}
          applied={applied}
          cube={cube}
          reset={reset}
        />
      </section>
    </main>
  );
}

function LiveCubeOverlay({ cube }: { cube: CubeState }) {
  if (cube.color === '默认材质' && cube.scale === 1 && cube.material === '默认材质') return null;

  return (
    <div className="live-cube-layer" aria-hidden="true">
      <div
        className={`changed-cube material-${cube.material}`}
        style={{
          '--cube-color': cubeColors[cube.color],
          '--cube-scale': cube.scale,
        } as React.CSSProperties}
      >
        <span className="changed-cube-dot" />
        <span className="changed-cube-side" />
        <span className="changed-cube-top" />
      </div>
    </div>
  );
}

function PropertyOverlay(props: {
  aiOpen: boolean;
  setAiOpen: (open: boolean) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  submit: (event: FormEvent) => void;
  proposal: Proposal | null;
  apply: () => void;
  applied: string[];
  cube: CubeState;
  reset: () => void;
}) {
  return (
    <aside className="property-overlay">
      <div className="side-tab"><b>▦</b><span>基础</span></div>
      <section className="panel-card">
        <header className="panel-head">
          <div className="title-wrap"><span className="cube-icon">◇</span><strong>立方体</strong></div>
          <button>•••</button>
          <button>×</button>
        </header>

        <div className="panel-scroll">
          <Fold title="模型" icon="⬟" open>
            <Info label="模型" value="立方体" />
            <Info label="材质颜色" value={props.cube.color} />
            <Info label="材质" value={props.cube.material} />
          </Fold>
          <Fold title="变换" icon="↔">
            <Info label="缩放" value={`${props.cube.scale.toFixed(1)} 倍`} />
            <Info label="位置" value="世界 Y 7.00" />
          </Fold>
          <Fold title="物理" icon="Ⅲ">
            <Info label="碰撞" value="开启" />
            <Info label="重力" value="跟随世界" />
          </Fold>

          <div className={`ai-section ${props.aiOpen ? 'open' : ''}`}>
            <button className="ai-title" onClick={() => props.setAiOpen(!props.aiOpen)}>
              <span className="arrow">▶</span><i>AI</i><strong>AI 助手</strong><em>•••</em>
            </button>
            {props.aiOpen && (
              <div className="ai-body">
                <div className="ai-scroll">
                  <p className="assistant-message">你好！我是 AI 助手。你可以告诉我想如何调整当前对象的属性。</p>

                  {props.proposal && (
                    <div className="ai-plan">
                      <div className="plan-preview" style={{ background: cubeColors[props.proposal.color] }} />
                      <div className="plan-detail">
                        <strong>AI 生成的修改方案</strong>
                        {props.proposal.summary.map((item) => <span key={item}>• {item}</span>)}
                      </div>
                      <div className="plan-actions">
                        <button onClick={props.reset}>取消</button>
                        <button className="primary" onClick={props.apply}>应用修改</button>
                      </div>
                    </div>
                  )}

                  {props.applied.length > 0 && !props.proposal && (
                    <div className="done-card">
                      <strong>已应用属性修改</strong>
                      {props.applied.map((item) => <span key={item}>✓ {item}</span>)}
                    </div>
                  )}
                </div>

                <form className="chat-input" onSubmit={props.submit}>
                  <input value={props.prompt} onChange={(event) => props.setPrompt(event.target.value)} placeholder="请输入你的需求..." />
                  <button type="submit">➤</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </aside>
  );
}

function Fold({ title, icon, open, children }: { title: string; icon: string; open?: boolean; children: React.ReactNode }) {
  return (
    <section className={`fold ${open ? 'open' : ''}`}>
      <div className="fold-title"><span>▶</span><i>{icon}</i><strong>{title}</strong><em>•••</em></div>
      {open && <div className="fold-content">{children}</div>}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="info"><span>{label}</span><b>{value}</b></div>;
}

createRoot(document.getElementById('root')!).render(<App />);
