!function(){const e=document.querySelectorAll(".clipboard-action_");for(const t in e)e[t].onclick=function(o){const n="#"+e[t].dataset.value,c=document.querySelector(n);if(navigator.clipboard.writeText(c.innerHTML),document.body.createTextRange){const e=document.body.createTextRange();e.moveToElementText(c),e.select()}else{if(!window.getSelection)return;{const e=window.getSelection(),t=document.createRange();t.selectNodeContents(c),e.removeAllRanges(),e.addRange(t)}}const a=document.querySelector(n+"_copy-result");a.classList.add("display_"),window.setTimeout((()=>a.classList.remove("display_")),3111)}}();