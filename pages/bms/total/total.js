
function drawCircle(query, context, power, current) {
  query.select('#bg-canvas').boundingClientRect();
  query.exec(function (res) {
    if (res == null || res.length == null) return;
    let x = res[0].width / 2;
    let y = res[0].height / 2;
    let diameter = res[0].height < res[0].width ? res[0].height : res[0].width;
    let r = diameter / 2 - 10;
    context.arc(x, y, r, 0, Math.PI * 2);
    context.setFillStyle('#ffffff');
    context.setLineDash([16, 9], 5);
    context.lineWidth = 4;
    context.setStrokeStyle('#4170BE');
    context.fill();
    context.stroke();

    context.beginPath();  // 划线
    context.setStrokeStyle('#4170BE');
    context.lineWidth = 1;
    context.setLineDash();
    context.moveTo(x - r, y);
    context.lineTo(x + r, y);
    let yLine2 = y + (Math.sqrt(3) / 2) * r;
    context.moveTo(x - r / 2, yLine2);
    context.lineTo(x + r / 2, yLine2);
    context.stroke();

    context.setFontSize(22);
    context.setFillStyle('#000000');
    context.fillText('功率', x - 22, y - r / 2);
    context.fillText('电流', x - 22, y + 28);
    context.fillText('W', x + r - 42, y - 3);
    context.fillText('A', x + r / 2 - 18, yLine2 - 3);
    context.fillText(power, x - 5.5 * power.length, y - 3);
    context.fillText(current, x - 5.5 * current.length, yLine2 - 3);
    context.draw();
  })
}

export { drawCircle}