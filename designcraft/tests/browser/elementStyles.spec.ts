import { test, expect, type Page } from '@playwright/test';
import { saveAndWait, storedProject } from './helpers/storage';
const base = process.env.DESIGN_QA_URL || 'http://localhost:3000';
async function load(page: Page, object: any) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => localStorage.setItem('unitool-lang', 'en'));
  await page.goto(base + '/designcraft.html');
  await page
    .locator('#designer-project-input')
    .setInputFiles({
      name: 'styling.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({
          format: 'unitool-designcraft',
          version: 1,
          project: {
            title: 'Style QA',
            width: 800,
            height: 600,
            canvasData: {
              objects: [
                {
                  id: 'target',
                  name: 'Styled target',
                  left: 80,
                  top: 80,
                  ...object,
                },
              ],
            },
          },
        }),
      ),
    });
  await expect(page.locator('canvas.upper-canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Layers', exact: true }).click();
  await page
    .locator('[data-layer-panel]:visible')
    .getByRole('button', { name: 'Styled target', exact: true })
    .click();
  return page.locator('.dc-element-extras:visible');
}
async function saved(page: Page) {
  await saveAndWait(page);
  return (await storedProject(page, 'Style QA')).canvasData.objects[0];
}
test('text has typography presets and a single undo restores all preset changes', async ({
  page,
}) => {
  const extras = await load(page, {
    type: 'textbox',
    text: 'New typography',
    width: 220,
    fontSize: 32,
    fontWeight: 800,
  });
  await expect(extras).toHaveAttribute('data-style-kind', 'text');
  await extras
    .getByRole('button', { name: 'Readable paragraph', exact: true })
    .click();
  let object = await saved(page);
  expect(object.fontSize).toBe(28);
  expect(object.fontWeight).toBe(400);
  expect(object.lineHeight).toBe(1.65);
  await page.keyboard.press('Control+z');
  await expect.poll(async () => (await saved(page)).fontSize).toBe(32);
});
test('lines expose line controls, dashed stroke and caps persist with blend and shadow', async ({
  page,
}) => {
  const extras = await load(page, {
    type: 'line',
    x1: 0,
    y1: 0,
    x2: 200,
    y2: 0,
    stroke: '#111111',
    strokeWidth: 3,
  });
  await expect(extras).toHaveAttribute('data-style-kind', 'line');
  await extras.getByRole('button', { name: 'Dashed', exact: true }).click();
  await extras.getByLabel('Line cap', { exact: true }).selectOption('round');
  await extras
    .getByLabel('Keep border weight when scaling', { exact: true })
    .check();
  await extras
    .getByLabel('Blend mode', { exact: true })
    .selectOption('multiply');
  await extras
    .getByRole('button', { name: 'Soft shadow', exact: true })
    .click();
  const object = await saved(page);
  expect(object.strokeDashArray).toEqual([10, 6]);
  expect(object.strokeLineCap).toBe('round');
  expect(object.strokeUniform).toBe(true);
  expect(object.globalCompositeOperation).toBe('multiply');
  expect(object.shadow.blur).toBe(18);
});
test('group-specific color control changes child paint and supports undo without replacing children', async ({
  page,
}) => {
  const extras = await load(page, {
    type: 'group',
    objects: [
      { type: 'rect', left: 0, top: 0, width: 80, height: 60, fill: '#ff0000' },
      {
        type: 'textbox',
        left: 90,
        top: 0,
        width: 100,
        text: 'Group text',
        fontSize: 22,
        fill: '#000000',
      },
    ],
  });
  await expect(extras).toHaveAttribute('data-style-kind', 'group');
  await expect(
    extras.getByRole('button', { name: 'Readable paragraph', exact: true }),
  ).toHaveCount(0);
  await extras
    .getByLabel('Group elements color', { exact: true })
    .fill('#00aa88');
  let object = await saved(page);
  expect(object.objects).toHaveLength(2);
  expect(object.objects.map((o: any) => o.fill)).toEqual([
    '#00aa88',
    '#00aa88',
  ]);
  expect(object.objects[1].text).toBe('Group text');
  await page.keyboard.press('Control+z');
  await expect
    .poll(async () => (await saved(page)).objects[0].fill)
    .toBe('#ff0000');
});
test('new text templates and vector shapes insert as real editable objects', async ({
  page,
}) => {
  await load(page, { type: 'rect', width: 80, height: 80, fill: '#ff0000' });
  await page.getByRole('button', { name: 'Text', exact: true }).click();
  await page.getByRole('button', { name: /عنوان يحكي حكايتك/ }).click();
  await saveAndWait(page);
  let project = await storedProject(page, 'Style QA');
  expect(
    project.canvasData.objects.some((o: any) => o.text === 'عنوان يحكي حكايتك'),
  ).toBe(true);
  await page.getByRole('button', { name: 'Elements', exact: true }).click();
  await page
    .getByRole('button', { name: /Open Advanced Shapes Library/ })
    .click();
  await page
    .getByRole('button', { name: 'Architectural arch', exact: true })
    .click();
  await saveAndWait(page);
  project = await storedProject(page, 'Style QA');
  expect(project.canvasData.objects.some((o: any) => o.type === 'path')).toBe(
    true,
  );
  expect(project.canvasData.objects).toHaveLength(3);
});
test('images expose blend and shadow controls without shape or typography options',async({page})=>{
 const src=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=20;const ctx=c.getContext('2d')!;ctx.fillStyle='#4488aa';ctx.fillRect(0,0,20,20);return c.toDataURL();});
 const extras=await load(page,{type:'image',src,width:20,height:20,scaleX:5,scaleY:5});
 await expect(extras).toHaveAttribute('data-style-kind','image');await expect(extras.getByRole('button',{name:'Dashed',exact:true})).toHaveCount(0);await expect(extras.getByRole('button',{name:'Readable paragraph',exact:true})).toHaveCount(0);
 await extras.getByLabel('Blend mode',{exact:true}).selectOption('screen');await extras.getByRole('button',{name:'Hard shadow',exact:true}).click();const image=await saved(page);expect(image.src).toBe(src);expect(image.globalCompositeOperation).toBe('screen');expect(image.shadow.offsetX).toBe(6);
});
test('geometry exposes stroke styles without text or group formatting',async({page})=>{
 const extras=await load(page,{type:'circle',radius:60,fill:'#88aa22'});await expect(extras).toHaveAttribute('data-style-kind','shape');await expect(extras.getByLabel('Group elements color',{exact:true})).toHaveCount(0);
 await extras.getByRole('button',{name:'Dotted',exact:true}).click();const circle=await saved(page);expect(circle.strokeDashArray).toEqual([1,5]);expect(circle.strokeLineCap).toBe('round');expect(circle.fill).toBe('#88aa22');
});
