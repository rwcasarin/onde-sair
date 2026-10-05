<?php
/**
 * Página padrão · usada pra páginas estáticas (VIP, Para negócios, Sobre…)
 */
if ( ! defined( 'ABSPATH' ) ) exit;
get_header(); ?>

<div class="shell">
    <article class="section" style="max-width:760px;margin:0 auto;">
        <?php while ( have_posts() ) : the_post(); ?>
            <span class="eyebrow">Página</span>
            <h1 class="display" style="font-size:clamp(34px,4.2vw,56px);margin:12px 0 24px;letter-spacing:-0.03em;line-height:1.12;"><?php the_title(); ?></h1>
            <div class="entry-content" style="font-size:17px;line-height:1.65;color:var(--ink-2);">
                <?php the_content(); ?>
            </div>
        <?php endwhile; ?>
    </article>
</div>

<?php get_footer();
