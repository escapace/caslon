import { createGenerator } from '@unocss/core'
import { describe, it } from 'vitest'
import { presetCaslon } from './index'

const fixture = async (...value: string[]) => {
  const uno = await createGenerator({
    presets: [presetCaslon()],
  })

  const { css } = await uno.generate(value.join(' '), {
    minify: false,
    preflights: true,
  })

  return css
}

// TODO: z-index, aspect-ratio

describe('presetCaslon', () => {
  it('aspect-ratio', async () => {
    // console.log(await fixture('aspect-video'))
    console.log(await fixture('border-spacing-10', 'animate-spin'))
    // console.log(await fixture('hover:aspect-3/4!'))
    // console.log(await fixture('aspect-(--qweqwe)'))
    // console.log(await fixture('aspect-[calc(4*3+1)]'))
    // // console.log(await fixture('[mask-type:luminance]'))
    // console.log(await fixture('[mask-type:luminance]!'))
  })

  // it('break-before', async () => {
  //   assert.equal(await fixture('break-before-auto'), '.break-before-auto{break-before:auto;}')
  //   assert.equal(await fixture('break-before-avoid'), '.break-before-avoid{break-before:avoid;}')
  //   assert.equal(await fixture('break-before-all'), '.break-before-all{break-before:all;}')
  //   assert.equal(
  //     await fixture('break-before-avoid-page'),
  //     '.break-before-avoid-page{break-before:avoid-page;}',
  //   )
  //   assert.equal(await fixture('break-before-page'), '.break-before-page{break-before:page;}')
  //   assert.equal(await fixture('break-before-left'), '.break-before-left{break-before:left;}')
  //   assert.equal(await fixture('break-before-right'), '.break-before-right{break-before:right;}')
  //   assert.equal(await fixture('break-before-column'), '.break-before-column{break-before:column;}')
  // })
  //
  // it('break-inside', async () => {
  //   assert.equal(await fixture('break-inside-auto'), '.break-inside-auto{break-inside:auto;}')
  //   assert.equal(await fixture('break-inside-avoid'), '.break-inside-avoid{break-inside:avoid;}')
  //   assert.equal(
  //     await fixture('break-inside-avoid-page'),
  //     '.break-inside-avoid-page{break-inside:avoid-page;}',
  //   )
  //   assert.equal(
  //     await fixture('break-inside-avoid-column'),
  //     '.break-inside-avoid-column{break-inside:avoid-column;}',
  //   )
  // })
  //
  // it('break-after', async () => {
  //   assert.equal(await fixture('break-after-auto'), '.break-after-auto{break-after:auto;}')
  //   assert.equal(await fixture('break-after-avoid'), '.break-after-avoid{break-after:avoid;}')
  //   assert.equal(await fixture('break-after-all'), '.break-after-all{break-after:all;}')
  //   assert.equal(
  //     await fixture('break-after-avoid-page'),
  //     '.break-after-avoid-page{break-after:avoid-page;}',
  //   )
  //   assert.equal(await fixture('break-after-page'), '.break-after-page{break-after:page;}')
  //   assert.equal(await fixture('break-after-left'), '.break-after-left{break-after:left;}')
  //   assert.equal(await fixture('break-after-right'), '.break-after-right{break-after:right;}')
  //   assert.equal(await fixture('break-after-column'), '.break-after-column{break-after:column;}')
  // })
  //
  // it('box-decoration-break', async () => {
  //   assert.equal(
  //     await fixture('box-decoration-clone'),
  //     '.box-decoration-clone{box-decoration-break:clone;}',
  //   )
  //   assert.equal(
  //     await fixture('box-decoration-slice'),
  //     '.box-decoration-slice{box-decoration-break:slice;}',
  //   )
  // })
  //
  // it('box-sizing', async () => {
  //   assert.equal(await fixture('box-border'), '.box-border{box-sizing:border-box;}')
  //   assert.equal(await fixture('box-content'), '.box-content{box-sizing:content-box;}')
  // })
  //
  // it('display', async () => {
  //   assert.equal(await fixture('inline'), '.inline{display:inline;}')
  //   assert.equal(await fixture('block'), '.block{display:block;}')
  //   assert.equal(await fixture('inline-block'), '.inline-block{display:inline-block;}')
  //   assert.equal(await fixture('flow-root'), '.flow-root{display:flow-root;}')
  //   assert.equal(await fixture('flex'), '.flex{display:flex;}')
  //   assert.equal(await fixture('inline-flex'), '.inline-flex{display:inline-flex;}')
  //   assert.equal(await fixture('grid'), '.grid{display:grid;}')
  //   assert.equal(await fixture('inline-grid'), '.inline-grid{display:inline-grid;}')
  //   assert.equal(await fixture('contents'), '.contents{display:contents;}')
  //   assert.equal(await fixture('table'), '.table{display:table;}')
  //   assert.equal(await fixture('inline-table'), '.inline-table{display:inline-table;}')
  //   assert.equal(await fixture('table-caption'), '.table-caption{display:table-caption;}')
  //   assert.equal(await fixture('table-cell'), '.table-cell{display:table-cell;}')
  //   assert.equal(await fixture('table-column'), '.table-column{display:table-column;}')
  //   assert.equal(
  //     await fixture('table-column-group'),
  //     '.table-column-group{display:table-column-group;}',
  //   )
  //   assert.equal(
  //     await fixture('table-footer-group'),
  //     '.table-footer-group{display:table-footer-group;}',
  //   )
  //   assert.equal(
  //     await fixture('table-header-group'),
  //     '.table-header-group{display:table-header-group;}',
  //   )
  //   assert.equal(await fixture('table-row-group'), '.table-row-group{display:table-row-group;}')
  //   assert.equal(await fixture('table-row'), '.table-row{display:table-row;}')
  //   assert.equal(await fixture('list-item'), '.list-item{display:list-item;}')
  //   assert.equal(await fixture('hidden'), '.hidden{display:none;}')
  //   assert.equal(
  //     await fixture('sr-only'),
  //     '.sr-only{border-width:0;clip:rect(0, 0, 0, 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;white-space:nowrap;width:1px;}',
  //   )
  //   assert.equal(
  //     await fixture('not-sr-only'),
  //     '.not-sr-only{clip:auto;height:auto;margin:0;overflow:visible;padding:0;position:static;white-space:normal;width:auto;}',
  //   )
  // })
  //
  // it('float', async () => {
  //   assert.equal(await fixture('float-left'), '.float-left{float:left;}')
  //   assert.equal(await fixture('float-right'), '.float-right{float:right;}')
  //   assert.equal(await fixture('float-start'), '.float-start{float:inline-start;}')
  //   assert.equal(await fixture('float-end'), '.float-end{float:inline-end;}')
  //   assert.equal(await fixture('float-none'), '.float-none{float:none;}')
  // })
  //
  // it('clear', async () => {
  //   assert.equal(await fixture('clear-left'), '.clear-left{clear:left;}')
  //   assert.equal(await fixture('clear-right'), '.clear-right{clear:right;}')
  //   assert.equal(await fixture('clear-both'), '.clear-both{clear:both;}')
  //   assert.equal(await fixture('clear-start'), '.clear-start{clear:inline-start;}')
  //   assert.equal(await fixture('clear-end'), '.clear-end{clear:inline-end;}')
  //   assert.equal(await fixture('clear-none'), '.clear-none{clear:none;}')
  // })
  //
  // it('isolation', async () => {
  //   assert.equal(await fixture('isolate'), '.isolate{isolation:isolate;}')
  //   assert.equal(await fixture('isolate-auto'), '.isolate-auto{isolation:auto;}')
  //   assert.equal(await fixture('isolation-auto'), '.isolation-auto{isolation:auto;}')
  // })
  //
  // it('object-fit', async () => {
  //   assert.equal(await fixture('object-cover'), '.object-cover{object-fit:cover;}')
  //   assert.equal(await fixture('object-contain'), '.object-contain{object-fit:contain;}')
  //   assert.equal(await fixture('object-fill'), '.object-fill{object-fit:fill;}')
  //   assert.equal(await fixture('object-scale-down'), '.object-scale-down{object-fit:scale-down;}')
  //   assert.equal(await fixture('object-none'), '.object-none{object-fit:none;}')
  // })
  //
  // it('overflow', async () => {
  //   assert.equal(await fixture('overflow-auto'), '.overflow-auto{overflow:auto;}')
  //   assert.equal(await fixture('overflow-hidden'), '.overflow-hidden{overflow:hidden;}')
  //   assert.equal(await fixture('overflow-clip'), '.overflow-clip{overflow:clip;}')
  //   assert.equal(await fixture('overflow-visible'), '.overflow-visible{overflow:visible;}')
  //   assert.equal(await fixture('overflow-scroll'), '.overflow-scroll{overflow:scroll;}')
  //   assert.equal(await fixture('overflow-x-auto'), '.overflow-x-auto{overflow-x:auto;}')
  //   assert.equal(await fixture('overflow-y-auto'), '.overflow-y-auto{overflow-y:auto;}')
  //   assert.equal(await fixture('overflow-x-hidden'), '.overflow-x-hidden{overflow-x:hidden;}')
  //   assert.equal(await fixture('overflow-y-hidden'), '.overflow-y-hidden{overflow-y:hidden;}')
  //   assert.equal(await fixture('overflow-x-clip'), '.overflow-x-clip{overflow-x:clip;}')
  //   assert.equal(await fixture('overflow-y-clip'), '.overflow-y-clip{overflow-y:clip;}')
  //   assert.equal(await fixture('overflow-x-visible'), '.overflow-x-visible{overflow-x:visible;}')
  //   assert.equal(await fixture('overflow-y-visible'), '.overflow-y-visible{overflow-y:visible;}')
  //   assert.equal(await fixture('overflow-x-scroll'), '.overflow-x-scroll{overflow-x:scroll;}')
  //   assert.equal(await fixture('overflow-y-scroll'), '.overflow-y-scroll{overflow-y:scroll;}')
  // })
  //
  // it('overscroll-behavior', async () => {
  //   assert.equal(await fixture('overscroll-auto'), '.overscroll-auto{overscroll-behavior:auto;}')
  //   assert.equal(
  //     await fixture('overscroll-contain'),
  //     '.overscroll-contain{overscroll-behavior:contain;}',
  //   )
  //   assert.equal(await fixture('overscroll-none'), '.overscroll-none{overscroll-behavior:none;}')
  //
  //   assert.equal(
  //     await fixture('overscroll-x-auto'),
  //     '.overscroll-x-auto{overscroll-behavior-x:auto;}',
  //   )
  //   assert.equal(
  //     await fixture('overscroll-x-contain'),
  //     '.overscroll-x-contain{overscroll-behavior-x:contain;}',
  //   )
  //   assert.equal(
  //     await fixture('overscroll-x-none'),
  //     '.overscroll-x-none{overscroll-behavior-x:none;}',
  //   )
  //
  //   assert.equal(
  //     await fixture('overscroll-y-auto'),
  //     '.overscroll-y-auto{overscroll-behavior-y:auto;}',
  //   )
  //   assert.equal(
  //     await fixture('overscroll-y-contain'),
  //     '.overscroll-y-contain{overscroll-behavior-y:contain;}',
  //   )
  //   assert.equal(
  //     await fixture('overscroll-y-none'),
  //     '.overscroll-y-none{overscroll-behavior-y:none;}',
  //   )
  // })
  //
  // it('position', async () => {
  //   assert.equal(await fixture('static'), '.static{position:static;}')
  //   assert.equal(await fixture('fixed'), '.fixed{position:fixed;}')
  //   assert.equal(await fixture('absolute'), '.absolute{position:absolute;}')
  //   assert.equal(await fixture('relative'), '.relative{position:relative;}')
  //   assert.equal(await fixture('sticky'), '.sticky{position:sticky;}')
  // })
  //
  // it('visibility', async () => {
  //   assert.equal(await fixture('visible'), '.visible{visibility:visible;}')
  //   assert.equal(await fixture('invisible'), '.invisible{visibility:hidden;}')
  //   assert.equal(await fixture('collapse'), '.collapse{visibility:collapse;}')
  // })
  //
  // it('flex-direction', async () => {
  //   assert.equal(await fixture('flex-row'), '.flex-row{flex-direction:row;}')
  //   assert.equal(
  //     await fixture('flex-row-reverse'),
  //     '.flex-row-reverse{flex-direction:row-reverse;}',
  //   )
  //   assert.equal(await fixture('flex-col'), '.flex-col{flex-direction:column;}')
  //   assert.equal(
  //     await fixture('flex-col-reverse'),
  //     '.flex-col-reverse{flex-direction:column-reverse;}',
  //   )
  // })
  //
  // it('flex-wrap', async () => {
  //   assert.equal(await fixture('flex-wrap'), '.flex-wrap{flex-wrap:wrap;}')
  //   assert.equal(await fixture('flex-wrap-reverse'), '.flex-wrap-reverse{flex-wrap:wrap-reverse;}')
  //   assert.equal(await fixture('flex-nowrap'), '.flex-nowrap{flex-wrap:nowrap;}')
  // })
  //
  // it('grid-auto-flow', async () => {
  //   assert.equal(await fixture('grid-flow-row'), '.grid-flow-row{grid-auto-flow:row;}')
  //   assert.equal(await fixture('grid-flow-col'), '.grid-flow-col{grid-auto-flow:column;}')
  //   assert.equal(await fixture('grid-flow-dense'), '.grid-flow-dense{grid-auto-flow:dense;}')
  //   assert.equal(
  //     await fixture('grid-flow-row-dense'),
  //     '.grid-flow-row-dense{grid-auto-flow:row dense;}',
  //   )
  //   assert.equal(
  //     await fixture('grid-flow-col-dense'),
  //     '.grid-flow-col-dense{grid-auto-flow:column dense;}',
  //   )
  // })
  //
  // it('justify-content', async () => {
  //   assert.equal(await fixture('justify-start'), '.justify-start{justify-content:flex-start;}')
  //   assert.equal(await fixture('justify-end'), '.justify-end{justify-content:flex-end;}')
  //   assert.equal(await fixture('justify-center'), '.justify-center{justify-content:center;}')
  //   assert.equal(
  //     await fixture('justify-between'),
  //     '.justify-between{justify-content:space-between;}',
  //   )
  //   assert.equal(await fixture('justify-around'), '.justify-around{justify-content:space-around;}')
  //   assert.equal(await fixture('justify-evenly'), '.justify-evenly{justify-content:space-evenly;}')
  //   assert.equal(await fixture('justify-stretch'), '.justify-stretch{justify-content:stretch;}')
  //   assert.equal(await fixture('justify-baseline'), '.justify-baseline{justify-content:baseline;}')
  //   assert.equal(await fixture('justify-normal'), '.justify-normal{justify-content:normal;}')
  // })
  //
  // it('justify-items', async () => {
  //   assert.equal(await fixture('justify-items-start'), '.justify-items-start{justify-items:start;}')
  //   assert.equal(await fixture('justify-items-end'), '.justify-items-end{justify-items:end;}')
  //   assert.equal(
  //     await fixture('justify-items-center'),
  //     '.justify-items-center{justify-items:center;}',
  //   )
  //   assert.equal(
  //     await fixture('justify-items-stretch'),
  //     '.justify-items-stretch{justify-items:stretch;}',
  //   )
  //   assert.equal(
  //     await fixture('justify-items-normal'),
  //     '.justify-items-normal{justify-items:normal;}',
  //   )
  // })
  //
  // it('justify-self', async () => {
  //   assert.equal(await fixture('justify-self-auto'), '.justify-self-auto{justify-self:auto;}')
  //   assert.equal(await fixture('justify-self-start'), '.justify-self-start{justify-self:start;}')
  //   assert.equal(await fixture('justify-self-end'), '.justify-self-end{justify-self:end;}')
  //   assert.equal(await fixture('justify-self-center'), '.justify-self-center{justify-self:center;}')
  //   assert.equal(
  //     await fixture('justify-self-stretch'),
  //     '.justify-self-stretch{justify-self:stretch;}',
  //   )
  // })
  //
  // it('align-content', async () => {
  //   assert.equal(await fixture('content-normal'), '.content-normal{align-content:normal;}')
  //   assert.equal(await fixture('content-center'), '.content-center{align-content:center;}')
  //   assert.equal(await fixture('content-start'), '.content-start{align-content:flex-start;}')
  //   assert.equal(await fixture('content-end'), '.content-end{align-content:flex-end;}')
  //   assert.equal(await fixture('content-between'), '.content-between{align-content:space-between;}')
  //   assert.equal(await fixture('content-around'), '.content-around{align-content:space-around;}')
  //   assert.equal(await fixture('content-evenly'), '.content-evenly{align-content:space-evenly;}')
  //   assert.equal(await fixture('content-baseline'), '.content-baseline{align-content:baseline;}')
  //   assert.equal(await fixture('content-stretch'), '.content-stretch{align-content:stretch;}')
  // })
  //
  // it('align-items', async () => {
  //   assert.equal(await fixture('items-start'), '.items-start{align-items:flex-start;}')
  //   assert.equal(await fixture('items-end'), '.items-end{align-items:flex-end;}')
  //   assert.equal(await fixture('items-center'), '.items-center{align-items:center;}')
  //   assert.equal(await fixture('items-baseline'), '.items-baseline{align-items:baseline;}')
  //   assert.equal(await fixture('items-stretch'), '.items-stretch{align-items:stretch;}')
  // })
  //
  // it('align-self', async () => {
  //   assert.equal(await fixture('self-auto'), '.self-auto{align-self:auto;}')
  //   assert.equal(await fixture('self-start'), '.self-start{align-self:flex-start;}')
  //   assert.equal(await fixture('self-end'), '.self-end{align-self:flex-end;}')
  //   assert.equal(await fixture('self-center'), '.self-center{align-self:center;}')
  //   assert.equal(await fixture('self-stretch'), '.self-stretch{align-self:stretch;}')
  //   assert.equal(await fixture('self-baseline'), '.self-baseline{align-self:baseline;}')
  // })
  //
  // it('place-content', async () => {
  //   assert.equal(
  //     await fixture('place-content-center'),
  //     '.place-content-center{place-content:center;}',
  //   )
  //   assert.equal(await fixture('place-content-start'), '.place-content-start{place-content:start;}')
  //   assert.equal(await fixture('place-content-end'), '.place-content-end{place-content:end;}')
  //   assert.equal(
  //     await fixture('place-content-between'),
  //     '.place-content-between{place-content:space-between;}',
  //   )
  //   assert.equal(
  //     await fixture('place-content-around'),
  //     '.place-content-around{place-content:space-around;}',
  //   )
  //   assert.equal(
  //     await fixture('place-content-evenly'),
  //     '.place-content-evenly{place-content:space-evenly;}',
  //   )
  //   assert.equal(
  //     await fixture('place-content-baseline'),
  //     '.place-content-baseline{place-content:baseline;}',
  //   )
  //   assert.equal(
  //     await fixture('place-content-stretch'),
  //     '.place-content-stretch{place-content:stretch;}',
  //   )
  // })
  //
  // it('place-items', async () => {
  //   assert.equal(await fixture('place-items-start'), '.place-items-start{place-items:start;}')
  //   assert.equal(await fixture('place-items-end'), '.place-items-end{place-items:end;}')
  //   assert.equal(await fixture('place-items-center'), '.place-items-center{place-items:center;}')
  //   assert.equal(
  //     await fixture('place-items-baseline'),
  //     '.place-items-baseline{place-items:baseline;}',
  //   )
  //   assert.equal(await fixture('place-items-stretch'), '.place-items-stretch{place-items:stretch;}')
  // })
  //
  // it('place-self', async () => {
  //   assert.equal(await fixture('place-self-auto'), '.place-self-auto{place-self:auto;}')
  //   assert.equal(await fixture('place-self-start'), '.place-self-start{place-self:start;}')
  //   assert.equal(await fixture('place-self-end'), '.place-self-end{place-self:end;}')
  //   assert.equal(await fixture('place-self-center'), '.place-self-center{place-self:center;}')
  //   assert.equal(await fixture('place-self-stretch'), '.place-self-stretch{place-self:stretch;}')
  // })
  //
  // it('font-smoothing', async () => {
  //   assert.equal(
  //     await fixture('antialiased'),
  //     '.antialiased{-moz-osx-font-smoothing:grayscale;-webkit-font-smoothing:antialiased;}',
  //   )
  //   assert.equal(
  //     await fixture('subpixel-antialiased'),
  //     '.subpixel-antialiased{-moz-osx-font-smoothing:auto;-webkit-font-smoothing:auto;}',
  //   )
  // })
  //
  // it('font-variant-numeric', async () => {
  //   assert.equal(await fixture('normal-nums'), '.normal-nums{font-variant-numeric:normal;}')
  //   assert.equal(await fixture('ordinal'), '.ordinal{font-variant-numeric:ordinal;}')
  //   assert.equal(await fixture('slashed-zero'), '.slashed-zero{font-variant-numeric:slashed-zero;}')
  //   assert.equal(await fixture('lining-nums'), '.lining-nums{font-variant-numeric:lining-nums;}')
  //   assert.equal(
  //     await fixture('oldstyle-nums'),
  //     '.oldstyle-nums{font-variant-numeric:oldstyle-nums;}',
  //   )
  //   assert.equal(
  //     await fixture('proportional-nums'),
  //     '.proportional-nums{font-variant-numeric:proportional-nums;}',
  //   )
  //   assert.equal(await fixture('tabular-nums'), '.tabular-nums{font-variant-numeric:tabular-nums;}')
  //   assert.equal(
  //     await fixture('diagonal-fractions'),
  //     '.diagonal-fractions{font-variant-numeric:diagonal-fractions;}',
  //   )
  //   assert.equal(
  //     await fixture('stacked-fractions'),
  //     '.stacked-fractions{font-variant-numeric:stacked-fractions;}',
  //   )
  // })
  //
  // it('list-style-position', async () => {
  //   assert.equal(await fixture('list-outside'), '.list-outside{list-style-position:outside;}')
  //   assert.equal(await fixture('list-inside'), '.list-inside{list-style-position:inside;}')
  // })
  //
  // it('text-align', async () => {
  //   assert.equal(await fixture('text-left'), '.text-left{text-align:left;}')
  //   assert.equal(await fixture('text-center'), '.text-center{text-align:center;}')
  //   assert.equal(await fixture('text-right'), '.text-right{text-align:right;}')
  //   assert.equal(await fixture('text-justify'), '.text-justify{text-align:justify;}')
  //   assert.equal(await fixture('text-start'), '.text-start{text-align:start;}')
  //   assert.equal(await fixture('text-end'), '.text-end{text-align:end;}')
  // })
  //
  // it('text-decoration-line', async () => {
  //   assert.equal(await fixture('underline'), '.underline{text-decoration-line:underline;}')
  //   assert.equal(await fixture('overline'), '.overline{text-decoration-line:overline;}')
  //   assert.equal(await fixture('line-through'), '.line-through{text-decoration-line:line-through;}')
  //   assert.equal(await fixture('no-underline'), '.no-underline{text-decoration-line:none;}')
  // })
  //
  // it('text-decoration-style', async () => {
  //   assert.equal(
  //     await fixture('decoration-solid'),
  //     '.decoration-solid{text-decoration-style:solid;}',
  //   )
  //   assert.equal(
  //     await fixture('decoration-double'),
  //     '.decoration-double{text-decoration-style:double;}',
  //   )
  //   assert.equal(
  //     await fixture('decoration-dotted'),
  //     '.decoration-dotted{text-decoration-style:dotted;}',
  //   )
  //   assert.equal(
  //     await fixture('decoration-dashed'),
  //     '.decoration-dashed{text-decoration-style:dashed;}',
  //   )
  //   assert.equal(await fixture('decoration-wavy'), '.decoration-wavy{text-decoration-style:wavy;}')
  // })
  //
  // it('text-transform', async () => {
  //   assert.equal(await fixture('uppercase'), '.uppercase{text-transform:uppercase;}')
  //   assert.equal(await fixture('lowercase'), '.lowercase{text-transform:lowercase;}')
  //   assert.equal(await fixture('capitalize'), '.capitalize{text-transform:capitalize;}')
  //   assert.equal(await fixture('normal-case'), '.normal-case{text-transform:none;}')
  // })
  //
  // it('text-overflow', async () => {
  //   assert.equal(
  //     await fixture('truncate'),
  //     '.truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
  //   )
  //   assert.equal(await fixture('text-ellipsis'), '.text-ellipsis{text-overflow:ellipsis;}')
  //   assert.equal(await fixture('text-clip'), '.text-clip{text-overflow:clip;}')
  // })
  //
  // it('text-wrap', async () => {
  //   assert.equal(await fixture('text-wrap'), '.text-wrap{text-wrap:wrap;}')
  //   assert.equal(await fixture('text-nowrap'), '.text-nowrap{text-wrap:nowrap;}')
  //   assert.equal(await fixture('text-balance'), '.text-balance{text-wrap:balance;}')
  //   assert.equal(await fixture('text-pretty'), '.text-pretty{text-wrap:pretty;}')
  // })
  //
  // it('white-space', async () => {
  //   assert.equal(await fixture('whitespace-normal'), '.whitespace-normal{white-space:normal;}')
  //   assert.equal(await fixture('whitespace-nowrap'), '.whitespace-nowrap{white-space:nowrap;}')
  //   assert.equal(await fixture('whitespace-pre'), '.whitespace-pre{white-space:pre;}')
  //   assert.equal(
  //     await fixture('whitespace-pre-line'),
  //     '.whitespace-pre-line{white-space:pre-line;}',
  //   )
  //   assert.equal(
  //     await fixture('whitespace-pre-wrap'),
  //     '.whitespace-pre-wrap{white-space:pre-wrap;}',
  //   )
  //   assert.equal(
  //     await fixture('whitespace-break-spaces'),
  //     '.whitespace-break-spaces{white-space:break-spaces;}',
  //   )
  // })
  //
  // it('word-break', async () => {
  //   assert.equal(
  //     await fixture('break-normal'),
  //     '.break-normal{overflow-wrap:normal;word-break:normal;}',
  //   )
  //   assert.equal(await fixture('break-words'), '.break-words{overflow-wrap:break-word;}')
  //   assert.equal(await fixture('break-all'), '.break-all{word-break:break-all;}')
  //   assert.equal(await fixture('break-keep'), '.break-keep{word-break:keep-all;}')
  // })
  //
  // it('hyphens', async () => {
  //   assert.equal(await fixture('hyphens-none'), '.hyphens-none{hyphens:none;}')
  //   assert.equal(await fixture('hyphens-manual'), '.hyphens-manual{hyphens:manual;}')
  //   assert.equal(await fixture('hyphens-auto'), '.hyphens-auto{hyphens:auto;}')
  // })
  //
  // it('hyphens', async () => {
  //   assert.equal(await fixture('hyphens-none'), '.hyphens-none{hyphens:none;}')
  //   assert.equal(await fixture('hyphens-manual'), '.hyphens-manual{hyphens:manual;}')
  //   assert.equal(await fixture('hyphens-auto'), '.hyphens-auto{hyphens:auto;}')
  // })
  //
  // it('background-attachment', async () => {
  //   assert.equal(await fixture('bg-fixed'), '.bg-fixed{background-attachment:fixed;}')
  //   assert.equal(await fixture('bg-local'), '.bg-local{background-attachment:local;}')
  //   assert.equal(await fixture('bg-scroll'), '.bg-scroll{background-attachment:scroll;}')
  // })
  //
  // it('background-clip', async () => {
  //   assert.equal(await fixture('bg-clip-border'), '.bg-clip-border{background-clip:border-box;}')
  //   assert.equal(await fixture('bg-clip-padding'), '.bg-clip-padding{background-clip:padding-box;}')
  //   assert.equal(await fixture('bg-clip-content'), '.bg-clip-content{background-clip:content-box;}')
  //   assert.equal(await fixture('bg-clip-text'), '.bg-clip-text{background-clip:text;}')
  // })
  //
  // it('background-origin', async () => {
  //   assert.equal(
  //     await fixture('bg-origin-border'),
  //     '.bg-origin-border{background-origin:border-box;}',
  //   )
  //   assert.equal(
  //     await fixture('bg-origin-padding'),
  //     '.bg-origin-padding{background-origin:padding-box;}',
  //   )
  //   assert.equal(
  //     await fixture('bg-origin-content'),
  //     '.bg-origin-content{background-origin:content-box;}',
  //   )
  // })
  //
  // it('background-repeat', async () => {
  //   assert.equal(await fixture('bg-repeat'), '.bg-repeat{background-repeat:repeat;}')
  //   assert.equal(await fixture('bg-repeat-x'), '.bg-repeat-x{background-repeat:repeat-x;}')
  //   assert.equal(await fixture('bg-repeat-y'), '.bg-repeat-y{background-repeat:repeat-y;}')
  //   assert.equal(await fixture('bg-repeat-space'), '.bg-repeat-space{background-repeat:space;}')
  //   assert.equal(await fixture('bg-repeat-round'), '.bg-repeat-round{background-repeat:round;}')
  //   assert.equal(await fixture('bg-no-repeat'), '.bg-no-repeat{background-repeat:no-repeat;}')
  // })
  //
  // it('outline', async () => {
  //   assert.equal(await fixture('outline-solid'), '.outline-solid{outline-style:solid;}')
  //   assert.equal(await fixture('outline-dashed'), '.outline-dashed{outline-style:dashed;}')
  //   assert.equal(await fixture('outline-dotted'), '.outline-dotted{outline-style:dotted;}')
  //   assert.equal(await fixture('outline-double'), '.outline-double{outline-style:double;}')
  //   assert.equal(await fixture('outline-none'), '.outline-none{outline-style:none;}')
  //   assert.equal(
  //     await fixture('outline-hidden'),
  //     '.outline-hidden{outline:2px solid transparent;outline-offset:2px;}',
  //   )
  // })
  //
  // it('mix-blend-mode', async () => {
  //   assert.equal(await fixture('mix-blend-normal'), '.mix-blend-normal{mix-blend-mode:normal;}')
  //   assert.equal(
  //     await fixture('mix-blend-multiply'),
  //     '.mix-blend-multiply{mix-blend-mode:multiply;}',
  //   )
  //   assert.equal(await fixture('mix-blend-screen'), '.mix-blend-screen{mix-blend-mode:screen;}')
  //   assert.equal(await fixture('mix-blend-overlay'), '.mix-blend-overlay{mix-blend-mode:overlay;}')
  //   assert.equal(await fixture('mix-blend-darken'), '.mix-blend-darken{mix-blend-mode:darken;}')
  //   assert.equal(await fixture('mix-blend-lighten'), '.mix-blend-lighten{mix-blend-mode:lighten;}')
  //   assert.equal(
  //     await fixture('mix-blend-color-dodge'),
  //     '.mix-blend-color-dodge{mix-blend-mode:color-dodge;}',
  //   )
  //   assert.equal(
  //     await fixture('mix-blend-color-burn'),
  //     '.mix-blend-color-burn{mix-blend-mode:color-burn;}',
  //   )
  //   assert.equal(
  //     await fixture('mix-blend-hard-light'),
  //     '.mix-blend-hard-light{mix-blend-mode:hard-light;}',
  //   )
  //   assert.equal(
  //     await fixture('mix-blend-soft-light'),
  //     '.mix-blend-soft-light{mix-blend-mode:soft-light;}',
  //   )
  //   assert.equal(
  //     await fixture('mix-blend-difference'),
  //     '.mix-blend-difference{mix-blend-mode:difference;}',
  //   )
  //   assert.equal(
  //     await fixture('mix-blend-exclusion'),
  //     '.mix-blend-exclusion{mix-blend-mode:exclusion;}',
  //   )
  //   assert.equal(await fixture('mix-blend-hue'), '.mix-blend-hue{mix-blend-mode:hue;}')
  //   assert.equal(
  //     await fixture('mix-blend-saturation'),
  //     '.mix-blend-saturation{mix-blend-mode:saturation;}',
  //   )
  //   assert.equal(await fixture('mix-blend-color'), '.mix-blend-color{mix-blend-mode:color;}')
  //   assert.equal(
  //     await fixture('mix-blend-luminosity'),
  //     '.mix-blend-luminosity{mix-blend-mode:luminosity;}',
  //   )
  //   assert.equal(
  //     await fixture('mix-blend-plus-darker'),
  //     '.mix-blend-plus-darker{mix-blend-mode:plus-darker;}',
  //   )
  //   assert.equal(
  //     await fixture('mix-blend-plus-lighter'),
  //     '.mix-blend-plus-lighter{mix-blend-mode:plus-lighter;}',
  //   )
  // })
  //
  // it('background-blend-mode', async () => {
  //   assert.equal(
  //     await fixture('bg-blend-normal'),
  //     '.bg-blend-normal{background-blend-mode:normal;}',
  //   )
  //   assert.equal(
  //     await fixture('bg-blend-multiply'),
  //     '.bg-blend-multiply{background-blend-mode:multiply;}',
  //   )
  //   assert.equal(
  //     await fixture('bg-blend-screen'),
  //     '.bg-blend-screen{background-blend-mode:screen;}',
  //   )
  //   assert.equal(
  //     await fixture('bg-blend-overlay'),
  //     '.bg-blend-overlay{background-blend-mode:overlay;}',
  //   )
  //   assert.equal(
  //     await fixture('bg-blend-darken'),
  //     '.bg-blend-darken{background-blend-mode:darken;}',
  //   )
  //   assert.equal(
  //     await fixture('bg-blend-lighten'),
  //     '.bg-blend-lighten{background-blend-mode:lighten;}',
  //   )
  //   assert.equal(
  //     await fixture('bg-blend-color-dodge'),
  //     '.bg-blend-color-dodge{background-blend-mode:color-dodge;}',
  //   )
  //   assert.equal(
  //     await fixture('bg-blend-color-burn'),
  //     '.bg-blend-color-burn{background-blend-mode:color-burn;}',
  //   )
  //   assert.equal(
  //     await fixture('bg-blend-hard-light'),
  //     '.bg-blend-hard-light{background-blend-mode:hard-light;}',
  //   )
  //   assert.equal(
  //     await fixture('bg-blend-soft-light'),
  //     '.bg-blend-soft-light{background-blend-mode:soft-light;}',
  //   )
  //   assert.equal(
  //     await fixture('bg-blend-difference'),
  //     '.bg-blend-difference{background-blend-mode:difference;}',
  //   )
  //   assert.equal(
  //     await fixture('bg-blend-exclusion'),
  //     '.bg-blend-exclusion{background-blend-mode:exclusion;}',
  //   )
  //   assert.equal(await fixture('bg-blend-hue'), '.bg-blend-hue{background-blend-mode:hue;}')
  //   assert.equal(
  //     await fixture('bg-blend-saturation'),
  //     '.bg-blend-saturation{background-blend-mode:saturation;}',
  //   )
  //   assert.equal(await fixture('bg-blend-color'), '.bg-blend-color{background-blend-mode:color;}')
  //   assert.equal(
  //     await fixture('bg-blend-luminosity'),
  //     '.bg-blend-luminosity{background-blend-mode:luminosity;}',
  //   )
  // })
  //
  // it('border-collapse', async () => {
  //   assert.equal(await fixture('border-collapse'), '.border-collapse{border-collapse:collapse;}')
  //   assert.equal(await fixture('border-separate'), '.border-separate{border-collapse:separate;}')
  // })
  //
  // it('table-layout', async () => {
  //   assert.equal(await fixture('table-auto'), '.table-auto{table-layout:auto;}')
  //   assert.equal(await fixture('table-fixed'), '.table-fixed{table-layout:fixed;}')
  // })
  //
  // it('caption-side', async () => {
  //   assert.equal(await fixture('caption-top'), '.caption-top{caption-side:top;}')
  //   assert.equal(await fixture('caption-bottom'), '.caption-bottom{caption-side:bottom;}')
  // })
  //
  // it('transition-behavior', async () => {
  //   assert.equal(
  //     await fixture('transition-normal'),
  //     '.transition-normal{transition-behavior:normal;}',
  //   )
  //   assert.equal(
  //     await fixture('transition-discrete'),
  //     '.transition-discrete{transition-behavior:allow-discrete;}',
  //   )
  // })
  //
  // it('backface-visibility', async () => {
  //   assert.equal(await fixture('backface-hidden'), '.backface-hidden{backface-visibility:hidden;}')
  //   assert.equal(
  //     await fixture('backface-visible'),
  //     '.backface-visible{backface-visibility:visible;}',
  //   )
  // })
  //
  // it('transform-style', async () => {
  //   assert.equal(await fixture('transform-3d'), '.transform-3d{transform-style:preserve-3d;}')
  //   assert.equal(await fixture('transform-flat'), '.transform-flat{transform-style:flat;}')
  // })
  //
  // it('appearance', async () => {
  //   assert.equal(await fixture('appearance-none'), '.appearance-none{appearance:none;}')
  //   assert.equal(await fixture('appearance-auto'), '.appearance-auto{appearance:auto;}')
  // })
  //
  // it('color-scheme', async () => {
  //   assert.equal(await fixture('scheme-normal'), '.scheme-normal{color-scheme:normal;}')
  //   assert.equal(await fixture('scheme-dark'), '.scheme-dark{color-scheme:dark;}')
  //   assert.equal(await fixture('scheme-light'), '.scheme-light{color-scheme:light;}')
  //   assert.equal(await fixture('scheme-light-dark'), '.scheme-light-dark{color-scheme:light dark;}')
  //   assert.equal(await fixture('scheme-only-dark'), '.scheme-only-dark{color-scheme:only dark;}')
  //   assert.equal(await fixture('scheme-only-light'), '.scheme-only-light{color-scheme:only light;}')
  // })
  //
  // it('field-sizing', async () => {
  //   assert.equal(await fixture('field-sizing-fixed'), '.field-sizing-fixed{field-sizing:fixed;}')
  //   assert.equal(
  //     await fixture('field-sizing-content'),
  //     '.field-sizing-content{field-sizing:content;}',
  //   )
  // })
  //
  // it('pointer-events', async () => {
  //   assert.equal(await fixture('pointer-events-auto'), '.pointer-events-auto{pointer-events:auto;}')
  //   assert.equal(await fixture('pointer-events-none'), '.pointer-events-none{pointer-events:none;}')
  // })
  //
  // it('resize', async () => {
  //   assert.equal(await fixture('resize-none'), '.resize-none{resize:none;}')
  //   assert.equal(await fixture('resize'), '.resize{resize:both;}')
  //   assert.equal(await fixture('resize-y'), '.resize-y{resize:vertical;}')
  //   assert.equal(await fixture('resize-x'), '.resize-x{resize:horizontal;}')
  // })
  //
  // it('scroll-behavior', async () => {
  //   assert.equal(await fixture('scroll-auto'), '.scroll-auto{scroll-behavior:auto;}')
  //   assert.equal(await fixture('scroll-smooth'), '.scroll-smooth{scroll-behavior:smooth;}')
  // })
  //
  // it('scroll-snap-align', async () => {
  //   assert.equal(await fixture('snap-start'), '.snap-start{scroll-snap-align:start;}')
  //   assert.equal(await fixture('snap-end'), '.snap-end{scroll-snap-align:end;}')
  //   assert.equal(await fixture('snap-center'), '.snap-center{scroll-snap-align:center;}')
  //   assert.equal(await fixture('snap-align-none'), '.snap-align-none{scroll-snap-align:none;}')
  // })
  //
  // it('scroll-snap-stop', async () => {
  //   assert.equal(await fixture('snap-normal'), '.snap-normal{scroll-snap-stop:normal;}')
  //   assert.equal(await fixture('snap-always'), '.snap-always{scroll-snap-stop:always;}')
  // })
  //
  // it('touch-action', async () => {
  //   assert.equal(await fixture('touch-auto'), '.touch-auto{touch-action:auto;}')
  //   assert.equal(await fixture('touch-none'), '.touch-none{touch-action:none;}')
  //   assert.equal(await fixture('touch-pan-x'), '.touch-pan-x{touch-action:pan-x;}')
  //   assert.equal(await fixture('touch-pan-left'), '.touch-pan-left{touch-action:pan-left;}')
  //   assert.equal(await fixture('touch-pan-right'), '.touch-pan-right{touch-action:pan-right;}')
  //   assert.equal(await fixture('touch-pan-y'), '.touch-pan-y{touch-action:pan-y;}')
  //   assert.equal(await fixture('touch-pan-up'), '.touch-pan-up{touch-action:pan-up;}')
  //   assert.equal(await fixture('touch-pan-down'), '.touch-pan-down{touch-action:pan-down;}')
  //   assert.equal(await fixture('touch-pinch-zoom'), '.touch-pinch-zoom{touch-action:pinch-zoom;}')
  //   assert.equal(
  //     await fixture('touch-manipulation'),
  //     '.touch-manipulation{touch-action:manipulation;}',
  //   )
  // })
  //
  // it('user-select', async () => {
  //   assert.equal(await fixture('select-none'), '.select-none{user-select:none;}')
  //   assert.equal(await fixture('select-text'), '.select-text{user-select:text;}')
  //   assert.equal(await fixture('select-all'), '.select-all{user-select:all;}')
  //   assert.equal(await fixture('select-auto'), '.select-auto{user-select:auto;}')
  // })
  //
  // it('forced-color-adjust', async () => {
  //   assert.equal(
  //     await fixture('forced-color-adjust-auto'),
  //     '.forced-color-adjust-auto{forced-color-adjust:auto;}',
  //   )
  //   assert.equal(
  //     await fixture('forced-color-adjust-none'),
  //     '.forced-color-adjust-none{forced-color-adjust:none;}',
  //   )
  // })
})
