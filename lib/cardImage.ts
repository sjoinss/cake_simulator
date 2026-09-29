import { toBlob } from 'html-to-image';

// 케이크 카드(화면 요소)를 PNG로 찍어서 저장한다.
// 폰에서는 공유 창(사진 앱에 저장, 메신저로 보내기)을 열고, 안 되면(PC 등) 파일로 내려받는다.
export async function saveCardImage(node: HTMLElement, fileName: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const blob = await toBlob(node, {
    pixelRatio: 2,
    // 화면에서 줄여 보여주는 중이어도 원래 크기로 찍는다
    style: { transform: 'none', margin: '0' },
    // 둥근 모서리 바깥이 투명하면 사진 앱에서 검게 보일 수 있어 카드 바탕색으로 채운다
    backgroundColor: getComputedStyle(node).backgroundColor,
  });
  if (!blob) throw new Error('카드 이미지를 만들지 못했어요');

  const file = new File([blob], fileName, { type: 'image/png' });
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName });
      return 'shared';
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return 'cancelled';
      // 공유가 막혀 있으면 아래 내려받기로
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}
