<?php
header('Content-type:text/html; charset=utf-8');

require_once 'Text/LanguageDetect.php';
$l = new Text_LanguageDetect();

$a = json_decode(file_get_contents(dirname(__FILE__).'/data/text.js'));

$ok = 0;

$total = count($a);

$start = microtime(true);
for ($i=0, $iM = $total; $i < $iM; $i++) {
  $r = $l->detect($a[$i]->text);

  $k = array_keys($r);
  if($r[$k[0]] > 0.2){
    $ok++;
  }
}
$end = microtime(true);
$time = round($end-$start, 3);

echo "$iM items processed in {$time} secs ($ok with a score > 0.2)\n";
