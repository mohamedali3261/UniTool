import {test,expect} from '@playwright/test';
const base=process.env.DESIGN_QA_URL||'http://localhost:3000';
test('primary press feedback is green and release opens exactly one dialog; keyboard toggle stays operable',async({page})=>{
 await page.goto(base+'/designcraft.html#packaging');const toggle=page.getByTestId('designer-theme-toggle');await toggle.focus();await page.keyboard.press('Enter');await expect(page.locator('html')).toHaveAttribute('data-dc-theme','dark');const button=page.locator('.packaging-primary');await expect(button).toHaveCSS('background-color','rgb(36, 121, 94)');const box=(await button.boundingBox())!;await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await expect(button).toHaveCSS('background-color','rgb(23, 78, 58)');await page.mouse.up();await expect(page.getByRole('dialog')).toHaveCount(1);await page.getByRole('button',{name:'إغلاق قالب العلبة',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('dark graphic accents use green instead of blue',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('designcraft_theme_v1','dark'));await page.goto(base+'/designcraft.html#projects');const tab=page.getByRole('button',{name:/^مشاريعي/});await expect(tab).toHaveCSS('color','rgb(133, 204, 172)');await expect(tab).toHaveCSS('touch-action','manipulation');await expect(tab).toHaveCSS('border-color','rgb(67, 140, 111)');
});
