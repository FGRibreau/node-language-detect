<?php
header('Content-type:text/html; charset=utf-8');

require_once 'Text/LanguageDetect.php';
$l = new Text_LanguageDetect();

$f = file_get_contents(dirname(__FILE__).'/data/text.js');

// Cleaning the JS stuff
$f = str_replace('module.exports = ', '', substr($f, 0, strlen($f)-2));

$a = json_decode($f);

$t = time();
$ok = 0;
for ($i=0, $iM = count($a); $i < $iM; $i++) { 
  
  $r = $l->detect($a[$i]->text);

  $k = array_keys($r);
  if($r[$k[0]] > 0.2){
    $ok++;
  }
}

echo "$iM items processed in ".(time()-$t)." secs ($ok with a score > 0.2)";
