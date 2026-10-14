// 易方达 / 国信 看板共用：入职庆祝 + 今日面试跟进（同一份渲染代码，保证两边完全一致）
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function roundClass(round) { return round === '一面' ? 'r1' : 'r2'; }
  function roundAccent(round) { return round === '一面' ? 'round-r1' : 'round-r2'; }
  function ivColumns(n) { if (n <= 1) return '1fr'; if (n === 2) return '1fr 1fr'; return '1fr 1fr 1fr'; }
  function renderInterviews(interviews) {
    document.getElementById('iv-hint').textContent = interviews.length + ' 人';
      var ivList = document.getElementById('iv-list');
      ivList.style.gridTemplateColumns = ivColumns(interviews.length);
      if (!interviews.length) {
        ivList.innerHTML = '<div class="empty-hint">暂无今日面试</div>';
      } else {
        ivList.innerHTML = interviews.map(function (iv) {
          var round = iv.round === '一面' ? '一面' : '二面';
          return (
            '<article class="iv ' + roundAccent(round) + '">' +
              '<div class="iv-accent" aria-hidden="true"></div>' +
              '<div class="iv-body">' +
                '<div class="iv-top">' +
                  '<div class="iv-name">' + esc(iv.name || '') + '</div>' +
                  '<span class="iv-pill ' + roundClass(round) + '">' + esc(round) + '</span>' +
                '</div>' +
                '<div class="iv-when">' + (iv.when ? esc(iv.when) : '&nbsp;') + '</div>' +
              '</div>' +
            '</article>'
          );
        }).join('');
      }

  }
  function renderCelebrate(data) {
      var celeBlock = document.getElementById('cele-block');
      var cele = data.celebrate || {};
      var people = Array.isArray(cele.people) ? cele.people.filter(function (p) {
        return p && (String(p.name || '').trim() || String(p.title || '').trim());
      }) : [];
      var showCele = !!cele.enabled && people.length > 0;
      if (celeBlock) {
        celeBlock.hidden = !showCele;
        if (showCele) {
          document.getElementById('cele-hint').textContent = people.length + ' 人';
          var follows = [];
          people.forEach(function (p) {
            var f = String(p.follow || '').trim();
            if (f && follows.indexOf(f) < 0) follows.push(f);
          });
          var kicker = String(cele.kicker || '恭喜').trim() || '恭喜';
          var hi = kicker;
          if (follows.length === 1 && hi.indexOf(follows[0]) < 0) hi = kicker + follows[0];
          hi += ' 🎉';
          var n = people.length;
          var map = {1:'一',2:'两',3:'三',4:'四',5:'五',6:'六',7:'七',8:'八',9:'九',10:'十'};
          var nCN = map[n] || String(n);
          var mid = String(cele.summary || '').trim();
          if (!mid) mid = '今天入场' + (data.client || '') + nCN + '人';
          var parts = people.map(function (p) {
            var t = String(p.title || '').trim();
            var nm = String(p.name || '').trim();
            if (t && nm) return t + '·' + nm;
            return t || nm;
          }).filter(Boolean);
          var cheer = String(cele.cheer || '').trim();
          var loEl = document.getElementById('cele-lo');
          document.getElementById('cele-hi').textContent = hi;
          document.getElementById('cele-mid').textContent = mid;
          if (parts.length && cheer) {
            loEl.innerHTML = esc(parts.join(' ｜ ')) +
              '<div style="margin-top:10px;font-size:28px;color:#3a3a3c">' + esc(cheer) + '</div>';
          } else if (parts.length) {
            loEl.textContent = parts.join(' ｜ ');
          } else {
            loEl.textContent = cheer || '继续加油，再接再入！';
          }
        }
      }

  }
  window.BoardShared = { esc: esc, renderInterviews: renderInterviews, renderCelebrate: renderCelebrate,
    filterInterviews: function (data) { return (Array.isArray(data.interviews) ? data.interviews : []).filter(function (iv) { return iv && String(iv.name || '').trim(); }); } };
})();
