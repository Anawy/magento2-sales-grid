<?php
namespace JoshSpivey\SalesGrid\Helper;

class ConfigHelper extends \Magento\Framework\App\Helper\AbstractHelper
{
    /**
     * @param  string param
     */
    public function getConfig($req)
    {
        return $this->scopeConfig->getValue('salesgrid/' . $req);
    }
}
