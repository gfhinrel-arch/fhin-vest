import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Background, Scene, Zone, Camera, Center} from '../components/Stage';
import {Headline, words} from '../components/Headline';
import {Card, Pill, CheckItem, StepCards, Counter, Credit, Strike} from '../components/UI';
import {FlatShapes, Logo2D} from '../components/Flat';
import {MorphTransition} from '../components/MorphTransition';
import {C, FONT, MONO, FPS} from '../lib/tokens';
import {ramp, spr, sec} from '../lib/anim';
import {McBox} from '../lib/debug';
import voShort from '../../public/vo/vo.json';
import voLong from '../../public/vo/vo-long.json';

const VO_MAPS = {short: voShort, long: voLong} as const;

export type FhinVestProps = {
  handle: string;
  duration: number;
  audio?: string;
  voSet?: 'short' | 'long';
  mcDebug?: boolean;
};

// Real screenshot inside a browser card, with a pointer ring on the hot-spot.
const ShotStep: React.FC<{
  at: number;
  out?: number;
  src: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}> = ({at, out, src, label, x, y, w, h}) => {
  const f = useCurrentFrame();
  const p = ramp(f, at + 6, 16);
  const ring = ramp(f, at + 18, 14) * (f < (out ?? Infinity) ? 1 : 0);
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Card at={at} out={out} w={w} h={h} title="IDXresearch">
        <div style={{position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#fff'}}>
          <Img src={staticFile(src)} style={{width: '100%', display: 'block'}} />
          <div
            style={{
              position: 'absolute',
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: 88,
              height: 88,
              marginLeft: -44,
              marginTop: -44,
              borderRadius: 999,
              border: `4px solid ${C.accent}`,
              background: 'rgba(43,127,212,0.14)',
              transform: `scale(${0.4 + 0.6 * p})`,
              opacity: ring,
              boxShadow: `0 0 0 ${(1 - p) * 22}px rgba(43,127,212,0.18)`,
            }}
          />
        </div>
      </Card>
      <McBox
        kind="text"
        style={{
          position: 'absolute',
          bottom: 54,
          fontFamily: MONO,
          fontSize: 26,
          color: C.ink,
          background: C.card,
          padding: '12px 26px',
          borderRadius: 999,
          boxShadow: '0 14px 40px rgba(20,40,80,0.12)',
          opacity: p,
        }}
      >
        {label}
      </McBox>
    </div>
  );
};

// Real screenshot, framed, with a slow 2D camera push and drift.
const DemoShot: React.FC<{at: number; out?: number; src: string; w: number; h: number; caption?: string}> = ({
  at,
  out,
  src,
  w,
  h,
  caption,
}) => (
  <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
    <Card at={at} out={out} w={w} h={h} title="IDXresearch">
      <Img src={staticFile(src)} style={{width: '100%', display: 'block'}} />
    </Card>
    {caption && (
      <div style={{position: 'absolute', bottom: 54, fontFamily: MONO, fontSize: 24, color: C.muted, opacity: ramp(useCurrentFrame(), at + 10, 12)}}>
        {caption}
      </div>
    )}
  </div>
);

// A small 2D mark that flies in, rotates slowly, and leaves. Adds depth to a scene.
const FlyingObject: React.FC<{at: number; out?: number; x: number; y: number; size: number}> = ({
  at,
  out,
  x,
  y,
  size,
}) => {
  const f = useCurrentFrame();
  const p = ramp(f, at, 20);
  const q = out !== undefined ? ramp(f, out, 12) : 0;
  const rot = Math.sin((f - at) / 38) * 8;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity: (1 - q) * Math.min(1, p * 1.4),
        transform: `translateY(${(1 - p) * 40 - q * 30}px) rotate(${rot}deg) scale(${0.85 + 0.15 * p})`,
      }}
    >
      <Logo2D at={at} size={size} />
    </div>
  );
};

export const FhinVest: React.FC<FhinVestProps> = ({handle, duration, voSet = 'short', mcDebug = false}) => {
  const cut = (s: number) => sec((s * duration) / 180);
  const vo = VO_MAPS[voSet];

  return (
    <AbsoluteFill style={{fontFamily: FONT}}>
      {!mcDebug && <Background />}
      {mcDebug && <AbsoluteFill style={{background: '#fff'}} />}

      <Camera keys={[[0, 1.05, 0, 0], [cut(30), 1, 0, 0], [cut(90), 1.04, 0, -6], [cut(150), 1, 0, 0], [duration, 1.03, 0, -4]]}>
        {/* 1 - HOOK: 3D field + short line */}
        <Scene from={0} to={cut(16)} noIn>
          {!mcDebug && (
            <AbsoluteFill style={{opacity: 0.9}}>
              <FlatShapes at={0} />
            </AbsoluteFill>
          )}
          <Center>
            <Headline level="h1" items={words('Ask about a stock. Get an answer you can *check*.', cut(1))} />
            <div style={{height: 28}} />
            <Pill at={cut(8)} size={30}>
              not another confident paragraph
            </Pill>
          </Center>
        </Scene>

        {/* 2 - PROBLEM */}
        <Scene from={cut(16)} to={cut(42)}>
          <Center gap={8}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 14}}>
              <Headline level="h2" items={words('The data is real. It is hidden behind', cut(17))} />
              <Strike at={cut(24)} appear={cut(22)} word="opinions." size={46} />
            </div>
            <Headline level="h0" items={words('*Filters.*', cut(26))} />
          </Center>
          <div style={{position: 'absolute', left: 120, top: 200, opacity: 0.7}}>
            <FlyingObject at={cut(20)} out={cut(40)} x={0} y={0} size={200} />
          </div>
        </Scene>

        {/* 3 - SOLUTION */}
        <Scene from={cut(42)} to={cut(66)}>
          <Zone name="top">
            <Headline level="h1" items={words('Fhin *VEST* is a research assistant for IDX stocks.', cut(43))} />
          </Zone>
          <Zone name="center">
            <StepCards at={cut(50)} steps={['Ask', 'Pick data', 'Numbers']} vertical={false} />
          </Zone>
        </Scene>

        {/* 4 - LIVE WORKFLOW, real screenshots */}
        <Scene from={cut(66)} to={cut(100)}>
          <Zone name="top">
            <Headline level="h1" size={60} items={words('Which banks return over 15% on *equity*?', cut(67))} />
          </Zone>
          <DemoShot at={cut(72)} src="shots/screen.png" w={1140} h={660} caption="screen_companies · structured where · 1 credit" />
          <Credit at={cut(74)}>live data · Sectors Financial API</Credit>
        </Scene>

        <Scene from={cut(100)} to={cut(126)}>
          <Zone name="top">
            <Headline level="h1" size={60} items={words('Then a company breakdown, every ratio *labelled*.', cut(101))} />
          </Zone>
          <DemoShot at={cut(106)} src="shots/company.png" w={1140} h={660} caption="get_company_report · sections financials + valuation" />
        </Scene>

        {/* 6b - TRAPS (long cut only): the agent refuses, and stays inside its source */}
        {voSet === 'long' && (
          <>
            <Scene from={cut(126)} to={cut(137)}>
              <Center gap={18}>
                <Headline level="h1" size={62} items={words('"What should I *buy*?"', cut(127))} />
                <Pill at={cut(131)} size={30}>
                  out of scope · not advice
                </Pill>
              </Center>
            </Scene>
            <Scene from={cut(137)} to={cut(146)}>
              <Center gap={18}>
                <Headline level="h1" size={62} items={words('"What is the price of *Bitcoin*?"', cut(138))} />
                <Pill at={cut(142)} size={30}>
                  outside the data source
                </Pill>
              </Center>
            </Scene>
            <Scene from={cut(146)} to={cut(158)}>
              <Zone name="top">
                <Headline level="h1" size={58} items={words('The agent loop, streamed over *one* route', cut(147))} />
              </Zone>
              <Zone name="center">
                <div style={{display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1200}}>
                  <Pill at={cut(150)} size={26}>tool-calling, up to 4 rounds</Pill>
                  <Pill at={cut(151.5)} size={26}>temperature 0</Pill>
                  <Pill at={cut(153)} size={26}>dropped tool_call ids minted</Pill>
                  <Pill at={cut(154.5)} size={26}>long results never sliced</Pill>
                  <Pill at={cut(156)} size={26}>NDJSON stream</Pill>
                  <Pill at={cut(157.5)} size={26}>per-process cache</Pill>
                </div>
              </Zone>
            </Scene>
          </>
        )}

        {/* TECHNICAL / IMPACT */}
        <Scene from={cut(voSet === 'long' ? 158 : 126)} to={cut(voSet === 'long' ? 168 : 152)}>
          <Zone name="top">
            <Headline level="h1" items={words('Four tools. One data source. One rule about *honesty*.', cut(voSet === 'long' ? 158.5 : 127))} />
          </Zone>
          <Zone name="center">
            <div style={{display: 'flex', gap: 70, alignItems: 'center'}}>
              <Counter at={cut(voSet === 'long' ? 161 : 134)} to={4} suffix="" size={160} />
              <div style={{fontFamily: FONT, fontSize: 34, color: C.muted, maxWidth: 560, lineHeight: 1.4}}>
                tools: screener, company report, top movers, quarterly financials.
              </div>
            </div>
            <Credit at={cut(voSet === 'long' ? 163 : 138)}>cost modelled from Sectors API billing rules</Credit>
          </Zone>
        </Scene>

        {/* TUTORIAL: how to use the product. Long cut gets a wider window. */}
        <Scene from={cut(voSet === 'long' ? 168 : 152)} to={duration - sec(4)}>
          <Zone name="top">
            <Headline level="h1" items={words('How to *use* it', cut(voSet === 'long' ? 168.5 : 153))} />
          </Zone>
          <ShotStep at={cut(voSet === 'long' ? 168.6 : 154)} out={cut(voSet === 'long' ? 171 : 160)} src="shots/landing.png" label="1 · Ask a question, or open the screener" x={0.5} y={0.62} w={980} h={550} />
          <ShotStep at={cut(voSet === 'long' ? 171 : 160)} out={cut(voSet === 'long' ? 173.5 : 166)} src="shots/screen.png" label="2 · Filter the market by real numbers" x={0.35} y={0.35} w={980} h={550} />
          <ShotStep at={cut(voSet === 'long' ? 173.5 : 166)} src="shots/company.png" label="3 · Open a company, read every ratio" x={0.5} y={0.32} w={980} h={550} />
        </Scene>

        {/* END */}
        <Scene from={duration - sec(4)} to={duration} noOut>
          <Center>
            <BrandEnd at={duration - sec(3.5)} handle={handle} />
          </Center>
        </Scene>
      </Camera>

      {/* Shape morph carries motion across the hook -> problem boundary. */}
      <MorphTransition
        at={cut(16) - 11}
        holdBefore={10}
        holdAfter={46}
        from={{x: 0.84, y: 0.24, size: 180, points: [[0, -1], [1, 0], [0, 1], [-1, 0]]}}
        to={{x: 0.14, y: 0.74, size: 120, points: [[-1, -1], [1, -1], [1, 1], [-1, 1]]}}
      />

      {/* Voice-over: one clip per line, placed at its scripted second. */}
      {Object.entries(vo as Record<string, {at: number}>).map(([id, m]) => (
        <Sequence key={id} from={Math.round(m.at * FPS)}>
          <Audio src={staticFile(`vo/${id}.mp3`)} />
        </Sequence>
      ))}
      {/* Music bed, well under the voice. */}
      <Audio src={staticFile('audio/music.wav')} volume={0.14} />
    </AbsoluteFill>
  );
};

const BrandEnd: React.FC<{at: number; handle: string}> = ({at, handle}) => {
  const f = useCurrentFrame();
  const s = spr(f, at, {damping: 12, stiffness: 90, mass: 1});
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, transform: `scale(${0.88 + 0.12 * s})`}}>
      <Logo2D at={at} size={260} />
      <McBox kind="text" style={{fontFamily: FONT, fontWeight: 700, fontSize: 64, letterSpacing: -1.5, color: C.ink, opacity: ramp(f, at + 6, 12)}}>
        Fhin<span style={{color: C.accent}}>VEST</span>
      </McBox>
      <McBox kind="text" style={{fontFamily: FONT, fontWeight: 500, fontSize: 28, color: C.muted, opacity: ramp(f, at + 14, 12)}}>
        Research assistant for IDX stocks. Not financial advice.
      </McBox>
      <Pill at={at + 20} size={30}>{handle}</Pill>
    </div>
  );
};
