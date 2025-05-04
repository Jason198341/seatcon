// 첨부파일(이미지, PDF 등) 업로드 및 미리보기
(function() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*,application/pdf';
  fileInput.style = 'display:none;';
  const fileBtn = document.createElement('button');
  fileBtn.innerText = '📎';
  fileBtn.style = 'margin-left:0.5rem;font-size:1.3rem;background:none;border:none;cursor:pointer;';
  fileBtn.onclick = () => fileInput.click();
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Supabase Storage 업로드(실제 구현 필요)
    window.showToast('업로드 준비중(실제 구현 필요)', 'info');
    // 미리보기(이미지)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.style = 'max-width:120px;max-height:120px;margin:0.5rem;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08)';
        document.getElementById('messages').appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  };
  window.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('chat-form');
    if(form) { form.appendChild(fileBtn); form.appendChild(fileInput); }
  });
})();
